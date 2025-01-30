import igniteApp from '#utils/ignite_worker_app'

import steamData from '#services/steam_data'

import breeEmit from '#services/bree/emitter'

import { DateTime } from 'luxon'
import { SteamDataReject, SteamAPIStoreList } from '#services/steam_data/types'
import discordMessage from '#utils/discord_message'
import env from '#start/env'

const app = await igniteApp()

const { default: Catalogue } = await import('#models/catalogues/catalogue')
const { default: Wave } = await import('#models/treatments/wave')
type CatalogueType = InstanceType<typeof Catalogue>

// const lastWave = await Wave.query()
//   .orderBy('wave', 'desc')
//   .whereNot('step', 'done')
//   .first()
//   .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

// const newWave =
//   lastWave !== null
//     ? lastWave
//     : await Wave.create({})
//         .then(async (wave) => {
//           await discordMessage.custom('(worker_steam-list) New wave has been started')
//           return wave
//         })
//         .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

// const wave = newWave!

// if (lastWave === null)
//   await wave
//     .refresh()
//     .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

// if (wave.step === 'enrich' || wave.step === 'stats') {
//   await app!.terminate()
//   process.exit(0)
// }

await ingestCategories()
await ingestTags()

await ingestList()

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

  await discordMessage.custom('[Ingestor] Categories done updated')
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

  await discordMessage.custom('[Ingestor] Categories done updated')
}

async function ingestList() {
  while (true) {
    let list: SteamAPIStoreList | undefined

    try {
      const listResponse = await steamData.fetchStoreList(0, 1000)
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
      let iteStep = 100

      const sublist: Partial<CatalogueType>[] = list.apps
        .splice(0, list.apps.length > iteStep ? iteStep : list.apps.length)
        .map(
          (steamApp) =>
            ({
              id: steamApp.appid,
              name: steamApp.name,
              areDetailsEnriched: false,
              areReviewsEnriched: false,
              areAchievementsEnriched: false,
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
      // wave.lastAppid = sublist[sublist.length - 1].id!
      // await wave
      //   .save()
      //   .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
    }

    // if (!list?.have_more_results) {
    // wave.step = 'enrich'
    // await wave.save().catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
    await discordMessage.custom('(steamData) Steam listing done')
    break
    // }
  }
}
