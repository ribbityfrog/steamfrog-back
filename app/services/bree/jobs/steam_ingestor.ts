import env from '#start/env'
import igniteApp from '#utils/ignite_worker_app'

import breeEmit from '#services/bree/emitter'
import discordMessage from '#utils/discord_message'

import { DateTime } from 'luxon'
import type { SteamDataReject, SteamAPIStoreList } from '#services/steam_data/types'

import steamData from '#services/steam_data'

import { Achievement } from '#models/catalogues/types'

const app = await igniteApp()

const { default: db } = await import('@adonisjs/lucid/services/db')
const { default: Catalogue } = await import('#models/catalogues/catalogue')
const { default: Wave } = await import('#models/treatments/wave')
type CatalogueType = InstanceType<typeof Catalogue>
type WaveType = InstanceType<typeof Wave>

let tryWave: WaveType | null
try {
  tryWave = await Wave.query().orderBy('wave', 'desc').whereNot('step', 'done').first()

  if (tryWave === null) {
    tryWave = await Wave.create({})
    await discordMessage.custom('(worker_steam-ingestor) New wave has been started')
    await tryWave.refresh()
  }
} catch (err) {
  await breeEmit.failedAccessingDatabase(err.message, true)
}
const wave = tryWave!

if (wave.step === 'list') {
  await ingestCategories()
  await ingestTags()

  // const done = await ingestList()
  const done = await ingestList(100, 10, true, 1966200)

  if (done) {
    wave.step = 'items'
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

    await discordMessage.custom('(worker_steam-ingestor) Steam listing done')
  }
}

if (wave.step === 'items') {
  // const done = await Promise.all([
  //   ingestItems(4, 0),
  //   ingestItems(4, 1),
  //   ingestItems(4, 2),
  //   ingestItems(4, 3),
  // ])
  const done = [await ingestItems()]

  if (done.every((b) => b === true)) {
    wave.step = 'details'
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

    await discordMessage.custom('(worker_steam-ingestor) Steam items done')
  }
}

if (wave.step === 'details') {
  const done = await Promise.all([
    ingestDetails(4, 0),
    ingestDetails(4, 1),
    ingestDetails(4, 2),
    ingestDetails(4, 3),
  ])

  if (done.every((b) => b === true)) {
    // wave.step = 'done'
    wave.step = 'wait'
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

    await discordMessage.custom(
      '(worker_steam-ingestor) Steam details (reviews + achievements) done'
    )
  }
}

await app!.terminate()
process.exit(0)

/*****
 *** Ingestor functions
 *****/

async function ingestCategories() {
  const { default: Category } = await import('#models/catalogues/category')
  type CategoryType = InstanceType<typeof Category>

  const steamCategories = await steamData.fetchCategories(true)

  if (steamCategories.success === false) {
    await breeEmit.steamUnexpectedError(
      -1,
      `[SteamData] Could not get categories : ${steamCategories.statusText}`
    )
    return
  }

  const categories: Partial<CategoryType>[] = steamCategories.content.map(
    (category) =>
      ({
        id: category.categoryid,
        type: Category.typeCodeToString(category.type),
        name: category.display_name,
        order: category.edit_sort_order,
        logo: category.image_url,
      }) satisfies Partial<CategoryType>
  )

  await Category.updateOrCreateMany('id', categories).catch(
    async (err) => await breeEmit.failedAccessingDatabase(err.message, true)
  )

  await discordMessage.custom('[worker_steam-ingestor] Categories done updated')
}

async function ingestTags() {
  const { default: Tag } = await import('#models/catalogues/tag')
  type TagType = InstanceType<typeof Tag>

  const steamTags = await steamData.fetchTags(true)

  if (steamTags.success === false) {
    await breeEmit.steamUnexpectedError(
      -1,
      `[SteamData] Could not get tags : ${steamTags.statusText}`
    )
    return
  }

  const tags: Partial<TagType>[] = steamTags.content.map(
    (tag) =>
      ({
        id: tag.tagid,
        name: tag.name,
      }) satisfies Partial<TagType>
  )

  await Tag.updateOrCreateMany('id', tags).catch(
    async (err) => await breeEmit.failedAccessingDatabase(err.message, true)
  )

  await discordMessage.custom('[worker_steam-ingestor] Tags done updated')
}

async function ingestList(
  fetchStep: number = 20000,
  updateStep: number = 1000,
  partialForTests: boolean = false,
  forceIngestStart: number = 0
): Promise<boolean> {
  while (true) {
    let list: SteamAPIStoreList | undefined

    try {
      const listResponse = await steamData.fetchStoreList(
        forceIngestStart > 0 ? forceIngestStart : wave.lastAppid,
        fetchStep
      )
      list = listResponse.content
    } catch (issue) {
      const reason = issue as SteamDataReject
      if (reason.status === 429) await breeEmit.steamLimitExceeded(-1, true)
      else await breeEmit.steamUnexpectedReject(-1, reason, true)
    }

    if (list === undefined) {
      await app!.terminate()
      process.exit(1)
    }

    while (list.apps?.length > 0) {
      let iteStep = updateStep

      const sublist: Partial<CatalogueType>[] = list.apps
        .splice(0, list.apps.length > iteStep ? iteStep : list.apps.length)
        .map(
          (steamApp) =>
            ({
              id: steamApp.appid,
              group: wave.lastGroup,
              name: steamApp.name,
              isItemsEnriched: false,
              isDetailsEnriched: false,
              storeUpdatedAt: DateTime.fromSeconds(steamApp.last_modified),
            }) satisfies Partial<CatalogueType>
        )

      if (env.get('NODE_ENV') !== 'production')
        console.log(
          `Insert from ${sublist[0].id} to ${sublist[sublist.length - 1].id}, ${sublist.length} new apps, ${list.apps.length} left`
        )

      await Catalogue.updateOrCreateMany('id', sublist).catch(
        async (err) => await breeEmit.failedAccessingDatabase(err.message, true)
      )
      wave.lastAppid = sublist[sublist.length - 1].id!
      wave.lastGroup++
      await wave
        .save()
        .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
    }

    if (!list?.have_more_results || partialForTests) {
      await db
        .from(Catalogue.table)
        .whereRaw('store_updated_at = store_lastly_updated_at')
        .update('is_items_enriched', true)
        .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

      return true
    }
  }
}

async function ingestItems(groupMod: number = 1, groupModResult: number = 0): Promise<boolean> {
  while (true) {
    const steamApps = await Catalogue.query()
      .where('is_items_enriched', false)
      .andWhereRaw(`MOD("group", ${groupMod}) = ${groupModResult}`)
      .orderBy('id', 'asc')
      .limit(100)
      .catch(async (err) => {
        await breeEmit.failedAccessingDatabase(err.message, true)
        return null
      })

    if (steamApps === null) return false
    else if (steamApps.length === 0) return true

    const items = await steamData
      .fetchStoreItem(steamApps.map((item) => item.id))
      .catch(async (err) => {
        await discordMessage.steamReject(err)
        return null
      })

    if (items === null) return false

    for (const item of items.content) {
      const steamApp = steamApps.find((searchedApp) => searchedApp.id === item.appid)

      if (
        steamApp === undefined ||
        (steamApp.storeLastlyUpdatedAt !== null &&
          steamApp.storeUpdatedAt.equals(steamApp.storeLastlyUpdatedAt))
      )
        continue

      if (env.get('NODE_ENV') !== 'production')
        console.log(`Enriching ${steamApp.name} (${steamApp.id}) - ${steamApp.storeUpdatedAt}`)

      if (item.visible === false) {
        steamApp.appType = item.unvailable_for_country_restriction === true ? 'outer' : 'broken'
        steamApp.isDetailsEnriched = true
      } else if (item.type !== 0 && item.type !== 4) {
        steamApp.appType = 'trash'
        steamApp.isDetailsEnriched = true
      } else {
        steamApp.appType = item.type === 0 ? 'game' : 'dlc'

        steamApp.parentId = item?.related_items?.parent_appid ?? null

        if (item?.categories !== undefined)
          for (const categoryIds of Object.values(item.categories))
            if (categoryIds !== undefined) await steamApp.related('categories').sync(categoryIds)
        // Object.values(item.categories).forEach(
        //   async (categoryIds) => await steamApp.related('categories').sync(categoryIds)
        // )

        if (item.tagids !== undefined) await steamApp.related('tags').sync(item.tagids)

        steamApp.release = {
          date: item.release?.steam_release_date
            ? DateTime.fromSeconds(item.release.steam_release_date)
            : null,
          isReleased: !(item.release?.is_coming_soon === true),
          isEarlyAccess: item.release?.is_early_access === true,
          hasDemo: item.related_items?.demo_appid ? true : false,
        }

        steamApp.ageGate =
          item?.game_rating?.use_age_gate === true ? (item?.game_rating?.required_age ?? 0) : 0
        steamApp.rating = !item?.game_rating
          ? null
          : {
              type: item.game_rating.type,
              rating: item.game_rating.rating,
              descriptors: item.game_rating?.descriptors ?? [],
            }

        steamApp.platforms = item.platforms

        steamApp.developers = item.basic_info?.developers
          ? item.basic_info.developers.map((deveveloper) => deveveloper.name.substring(0, 255))
          : []
        steamApp.publishers = item.basic_info?.publishers
          ? item.basic_info.publishers.map((publisher) => publisher.name.substring(0, 255))
          : []
        steamApp.franchises = item.basic_info?.franchises
          ? item.basic_info.franchises.map((franchise) => franchise.name.substring(0, 255))
          : []

        steamApp.isFree = item?.is_free === true

        steamApp.pricing = item?.best_purchase_option
          ? {
              isPrePurchase: item.release?.is_coming_soon === true,
              priceDiscount: item.best_purchase_option?.discount_pct ?? 0,
              priceInitial: Number(
                item.best_purchase_option?.original_price_in_cents ??
                  item.best_purchase_option.final_price_in_cents
              ),
              priceFinal: Number(item.best_purchase_option.final_price_in_cents),
            }
          : null

        steamApp.languages =
          item?.supported_languages && item.supported_languages?.length > 0
            ? item.supported_languages.map((language) => ({
                elanguage: language.elanguage,
                language: 'unknown',
                supported: language.supported,
                audio: language.full_audio,
                subtitles: language.subtitles,
              }))
            : []

        steamApp.media = {
          screenshotCount: item?.screenshots?.all_ages_screenshots?.length ?? 0,
          videoCount: item.trailers?.highlights?.length ?? 0,
        }
      }

      steamApp.storePreviouslyUpdatedAt =
        steamApp.storeLastlyUpdatedAt !== null
          ? steamApp.storeLastlyUpdatedAt
          : steamApp.storeUpdatedAt
      steamApp.storeLastlyUpdatedAt = steamApp.storeUpdatedAt
      steamApp.isItemsEnriched = true
      await steamApp
        .save()
        .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
    }
  }
}

async function ingestDetails(groupMod: number = 1, groupModResult: number = 0): Promise<boolean> {
  while (true) {
    const steamApps = await Catalogue.query()
      .where('is_details_enriched', false)
      .andWhereRaw(`MOD("group", ${groupMod}) = ${groupModResult}`)
      .limit(100)
      .catch(async (err) => {
        await breeEmit.failedAccessingDatabase(err.message, true)
        return null
      })

    if (steamApps === null) return false
    if (steamApps.length === 0) return true

    for (const steamApp of steamApps) {
      if (env.get('NODE_ENV') !== 'production')
        console.log(
          `Enriching ${steamApp.name} (${steamApp.appType}_${steamApp.id}) - ${steamApp.storeUpdatedAt}`
        )

      const [reviews, achievements] = await Promise.all([
        steamData.fetchReviews(steamApp.id),
        steamApp.appType === 'game' ? steamData.fetchAchievements(steamApp.id) : null,
      ]).catch(async (err) => {
        await discordMessage.steamReject(err)
        process.exit(1)
      })

      steamApp.reviews = {
        score: reviews.content.review_score,
        scoreName: reviews.content.review_score_desc,
        positiveCount: reviews.content.total_positive,
        negativeCount: reviews.content.total_negative,
        totalCount: reviews.content.total_reviews,
      }

      if (achievements)
        steamApp.achievements =
          achievements.content.length > 0
            ? achievements.content.map(
                (achievement) =>
                  ({
                    name: achievement.name,
                    description: achievement?.description ?? '',
                    hidden: achievement.hidden,
                    percent: achievement.percent,
                  }) satisfies Achievement
              )
            : []

      steamApp.isDetailsEnriched = true

      await steamApp.save().catch(async (err) => {
        await breeEmit.failedAccessingDatabase(err.message, true)
      })
    }
  }
}
