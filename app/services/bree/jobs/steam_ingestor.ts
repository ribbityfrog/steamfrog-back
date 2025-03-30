import env from '#start/env'
import igniteApp from '#utils/ignite_worker_app'

import breeEmit from '#services/bree/emitter'
import discordMessage from '#utils/discord_message'

import { DateTime } from 'luxon'
import type { SteamDataReject, SteamAPIStoreList } from '#services/steam_data/types'

import steamData from '#services/steam_data'

const app = await igniteApp()

const { default: db } = await import('@adonisjs/lucid/services/db')
const { default: Catalogue } = await import('#models/catalogues/catalogue')
const { default: Wave } = await import('#models/treatments/wave')
type CatalogueModel = InstanceType<typeof Catalogue>
type WaveModel = InstanceType<typeof Wave>

const ingestTest = env.get('INGEST_TEST', false)
const ingestParallelDetails = env.get('INGEST_PARALLEL_DETAILS', 1)
const ingestParallelEnrich = env.get('INGEST_PARALLEL_ENRICH', 4)

let tryWave: WaveModel | null
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

  const done = ingestTest ? await ingestList(20000, 1000, true, 1966000) : await ingestList()

  if (done) {
    wave.step = 'items'
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

    await discordMessage.custom('(worker_steam-ingestor) Steam listing done')
  }
}

if (wave.step === 'items') {
  await discordMessage.custom('(worker_steam-ingestor) Steam items started')

  const promises: Promise<Boolean>[] = []
  for (let mod = 0; mod < ingestParallelDetails; mod++)
    promises.push(ingestItems(ingestParallelDetails, mod))

  const done = await Promise.all(promises)

  if (done.every((b) => b === true)) {
    wave.step = 'details'
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

    await discordMessage.custom('(worker_steam-ingestor) Steam items done')
  }
}

if (wave.step === 'details') {
  await discordMessage.custom(
    '(worker_steam-ingestor) Steam details (reviews + achievements) started'
  )

  const promises: Promise<Boolean>[] = []
  for (let mod = 0; mod < ingestParallelEnrich; mod++)
    promises.push(ingestDetails(ingestParallelEnrich, mod))

  const done = await Promise.all(promises)

  if (done.every((b) => b === true)) {
    wave.step = ingestTest ? 'wait' : 'done'
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

      const sublist: Partial<CatalogueModel>[] = list.apps
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
            }) satisfies Partial<CatalogueModel>
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
  const { default: Studio } = await import('#models/catalogues/studio')
  const { default: Franchise } = await import('#models/catalogues/franchise')
  const { default: Descriptor } = await import('#models/catalogues/descriptor')
  const { default: Language } = await import('#models/catalogues/language')
  const { default: Vr } = await import('#models/catalogues/vr')
  type StudioModel = InstanceType<typeof Studio>
  type FranchiseModel = InstanceType<typeof Franchise>
  type DescriptorModel = InstanceType<typeof Descriptor>

  const allLanguages = await Language.query()
    .select('id')
    .catch(async (err) => {
      await breeEmit.failedAccessingDatabase(err.message, true)
      return []
    })
  const languageCodes = allLanguages.map((language) => language.id)

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
        console.log(`Detailing ${steamApp.name} (${steamApp.id}) - ${steamApp.storeUpdatedAt}`)

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
            if (categoryIds !== undefined)
              await steamApp
                .related('categories')
                .sync(categoryIds)
                .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

        if (item.tagids !== undefined)
          await steamApp
            .related('tags')
            .sync(item.tagids)
            .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

        steamApp.release = {
          date: item.release?.steam_release_date
            ? DateTime.fromSeconds(item.release.steam_release_date)
            : null,
          isReleased: !(item.release?.is_coming_soon === true),
          isEarlyAccess: item.release?.is_early_access === true,
          hasDemo: item.related_items?.demo_appid ? true : false,
        }

        steamApp.maturity = {
          isMature: item.content_descriptorids?.includes(5) ?? false,
          isViolent: item.content_descriptorids?.includes(2) ?? false,
          isNudity: item.content_descriptorids?.includes(1) ?? false,
          isSexual: item.content_descriptorids?.includes(4) ?? false,
          isPorn: item.content_descriptorids?.includes(3) ?? false,
          ageGate:
            item?.game_rating?.use_age_gate === true ? (item?.game_rating?.required_age ?? 0) : 0,
        }

        steamApp.rating = !item?.game_rating
          ? null
          : {
              type: item.game_rating.type,
              rating: item.game_rating.rating,
              age: item.game_rating?.required_age ?? -1,
            }
        let descriptorsInstances: DescriptorModel[] = []
        if (
          item?.game_rating?.descriptors !== undefined &&
          item?.game_rating?.descriptors.length > 0
        ) {
          descriptorsInstances = await Descriptor.updateOrCreateMany(
            'name',
            item.game_rating.descriptors.reduce<Array<{ name: string }>>((acc, currents) => {
              const cleanedCurrents = currents
                .replace(/<[^>]*>/g, '')
                .split(/[,.•]+/)
                .map((name) => name.substring(0, 127).trim())
              for (const cleanedCurrent of cleanedCurrents)
                if (
                  cleanedCurrent.length > 0 &&
                  acc.find((f) => f.name === cleanedCurrent) === undefined
                )
                  acc.push({ name: cleanedCurrent })
              return acc
            }, [])
          ).catch(async (err) => {
            await breeEmit.failedAccessingDatabase({ message: err.message, id: steamApp.id }, true)
            return []
          })
        }
        await steamApp
          .related('descriptors')
          .sync(descriptorsInstances.map((descriptor) => descriptor.id))
          .catch(
            async (err) =>
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
          )

        steamApp.platforms = {
          windows: item.platforms?.windows === true,
          mac: item.platforms?.mac === true,
          linux: item.platforms?.steamos_linux === true,
          deck: item.platforms?.steam_deck_compat_category ?? 0,
        }

        if (item.platforms?.vr_support !== undefined) {
          const vrSupports = Object.keys(item.platforms.vr_support)

          if (vrSupports.length > 0) {
            const vrInstances = await Vr.updateOrCreateMany(
              'code',
              vrSupports.map((vrSupport) => ({ code: vrSupport }))
            ).catch(async (err) => {
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
              return []
            })

            await steamApp
              .related('vrs')
              .sync(vrInstances.map((vr) => vr.id))
              .catch(
                async (err) =>
                  await breeEmit.failedAccessingDatabase(
                    { message: err.message, id: steamApp.id },
                    true
                  )
              )
          }
        } else await steamApp.related('vrs').detach()

        const developers =
          item.basic_info?.developers?.reduce<Array<{ type: 'devel'; name: string }>>(
            (acc, current) => {
              const cleanedCurrent = current.name.substring(0, 255).trim()
              if (
                cleanedCurrent.length > 0 &&
                acc.find((devel) => devel.name === cleanedCurrent) === undefined
              )
                acc.push({ type: 'devel', name: cleanedCurrent })
              return acc
            },
            []
          ) ?? []

        const publishers =
          item.basic_info?.publishers?.reduce<Array<{ type: 'publi'; name: string }>>(
            (acc, current) => {
              const cleanedCurrent = current.name.substring(0, 255).trim()
              if (
                cleanedCurrent.length > 0 &&
                acc.find((publi) => publi.name === current.name) === undefined
              )
                acc.push({ type: 'publi', name: cleanedCurrent })
              return acc
            },
            []
          ) ?? []

        const studios = [...developers, ...publishers]
        let studioInstances: StudioModel[] = []
        if (publishers.length > 0)
          studioInstances = await Studio.updateOrCreateMany(['type', 'name'], studios).catch(
            async (err) => {
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
              return []
            }
          )
        await steamApp
          .related('studios')
          .sync(studioInstances.map((studio) => studio.id))
          .catch(
            async (err) =>
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
          )

        const franchises =
          item.basic_info?.franchises?.reduce<Array<{ name: string }>>((acc, current) => {
            const cleanedCurrent = current.name.substring(0, 255).trim()
            if (
              cleanedCurrent.length > 0 &&
              acc.find((f) => f.name === cleanedCurrent) === undefined
            )
              acc.push({ name: cleanedCurrent })
            return []
          }, []) ?? []

        let franchiseInstances: FranchiseModel[] = []
        if (franchises.length > 0)
          franchiseInstances = await Franchise.updateOrCreateMany('name', franchises).catch(
            async (err) => {
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
              return []
            }
          )
        await steamApp
          .related('franchises')
          .sync(franchiseInstances.map((franchise) => franchise.id))
          .catch(
            async (err) =>
              await breeEmit.failedAccessingDatabase(
                { message: err.message, id: steamApp.id },
                true
              )
          )

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

        if (steamApp.appType === 'game') {
          const languages: Record<
            number,
            {
              supported: boolean
              audio: boolean
              subtitles: boolean
            }
          > = {}
          if (item?.supported_languages && item.supported_languages?.length > 0) {
            let hasMissingLanguages = false
            for (const language of item.supported_languages) {
              let elang =
                language.elanguage === -1
                  ? language.eadditionallanguage + 1000
                  : language.elanguage === 27
                    ? 29
                    : language.elanguage
              if (!languageCodes.includes(elang)) {
                hasMissingLanguages = true
                continue
              }
              languages[elang] = {
                supported: language.supported,
                audio: language.full_audio,
                subtitles: language.subtitles,
              }
            }
            if (hasMissingLanguages)
              await discordMessage.custom(
                '(worker_steam-details) Missing language(s) for ' + steamApp.id
              )
          }
          await steamApp
            .related('languages')
            .sync(languages)
            .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
        }

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
  const { default: Achievement } = await import('#models/catalogues/achievement')
  type AchievementModel = InstanceType<typeof Achievement>

  while (true) {
    const steamApps = await Catalogue.query()
      .where('is_details_enriched', false)
      .andWhereRaw(`MOD("group", ${groupMod}) = ${groupModResult}`)
      .limit(100)
      .preload('review')
      .preload('achievements')
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

      const [reviewsData, achievementsData] = await Promise.all([
        steamData.fetchReviews(steamApp.id),
        steamApp.appType === 'game' ? steamData.fetchAchievements(steamApp.id) : null,
      ]).catch(async (err) => {
        await discordMessage.steamReject(err)
        process.exit(1)
      })

      const review = {
        scoreRounded: reviewsData.content.review_score,
        scorePercent:
          reviewsData.content.total_reviews > 0
            ? Math.trunc(
                (reviewsData.content.total_positive / reviewsData.content.total_reviews) *
                  100 *
                  1000
              )
            : 0,
        countPositive: reviewsData.content.total_positive,
        countNegative: reviewsData.content.total_negative,
        countAll: reviewsData.content.total_reviews,
      }
      if (steamApp.review) steamApp.review.merge(review)
      else
        await steamApp
          .related('review')
          .create(review)
          .catch(async (err) => {
            await discordMessage.custom(
              `(worker_steam-ingestor) Reviews fail for ${steamApp.id}, field in order:\n` +
                `${JSON.stringify(reviewsData.content)}`
              // `${review.scoreRounded}, ${review.scorePercent}, ${review.countPositive}, ${review.countNegative}, ${review.countAll}`
            )
            await breeEmit.failedAccessingDatabase({ message: err.message, id: steamApp.id }, true)
          })

      if (achievementsData) {
        const achievements: Partial<AchievementModel>[] =
          achievementsData.content.length > 0
            ? achievementsData.content.map(
                (achievement) =>
                  ({
                    name: achievement.name.substring(0, 255),
                    description: achievement?.description?.substring(0, 255) ?? null,
                    hidden: achievement.hidden,
                    percent: achievement.percent,
                  }) satisfies Partial<AchievementModel>
              )
            : []
        if (steamApp.achievements && steamApp.achievements.length > 0)
          await Achievement.query()
            .whereIn(
              'id',
              steamApp.achievements.map((a) => a.id.toString())
            )
            .delete()
            .catch(async (err) =>
              breeEmit.failedAccessingDatabase({ message: err.message, id: steamApp.id }, true)
            )
        if (achievements.length > 0) {
          await steamApp
            .related('achievements')
            .createMany(achievements)
            .catch(async (err) =>
              breeEmit.failedAccessingDatabase({ message: err.message, id: steamApp.id }, true)
            )
        }
      }

      steamApp.isDetailsEnriched = true

      await steamApp.save().catch(async (err) => {
        await breeEmit.failedAccessingDatabase(err.message, true)
      })
    }
  }
}
