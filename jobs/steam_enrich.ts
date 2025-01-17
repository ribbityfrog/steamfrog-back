import { workerData } from 'node:worker_threads'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import igniteApp from '#utils/ignite_app'
import breeEmit from '#services/bree/emitter'
import type {
  SteamAchievement,
  SteamDataResponse,
  SteamReviews,
  SteamStorePage,
} from '#services/steam_data/types'
import { Achievement } from '#models/catalogues/types'
import discordMessage from '#utils/discord_message'

const app = await igniteApp(workerData.appRootString)
if (app === null) breeEmit.failedIgnitingApp()

const wave = await Wave.query()
  .orderBy('wave', 'desc')
  .where('step', 'enrich')
  .first()
  .catch((err) => {
    breeEmit.failedAccessingDatabase(err.message)
    return null
  })
if (wave === null) process.exit(0)

while (true) {
  const steamApps = await SteamApp.query()
    .where('isEnriched', false)
    .andWhereNot('appType', 'outer')
    .andWhereNot('appType', 'broken')
    .orderBy('id', 'asc')
    .limit(100)
    .catch((err) => {
      breeEmit.failedAccessingDatabase(err.message)
      return null
    })

  if (steamApps === null || steamApps?.length === 0) break

  for (const steamApp of steamApps) {
    console.log(`Enriching ${steamApp.name} (${steamApp.id}) - ${steamApp.storeUpdatedAt}`)

    let storePage: SteamStorePage | undefined
    let achievements: SteamAchievement[] | undefined
    let reviews: SteamReviews | undefined

    if (steamApp.appType === 'new') {
      const storePageResponse = await steamData.fetchStorePage(steamApp.id, true)

      if (storePageResponse.success === true) storePage = storePageResponse.content
      else {
        if (storePageResponse.status === 429) breeEmit.steamLimitExceeded(steamApp.id)
        else {
          steamApp.appType = 'broken'
          await steamApp.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
          breeEmit.steamUnexpectedReject(steamApp.id, storePageResponse)
          continue
        }
      }
    }

    const steamPromises: Promise<SteamDataResponse>[] = [steamData.fetchReviews(steamApp.id)]

    if (
      steamApp.appType !== 'new' &&
      !steamApp.storeUpdatedAt.equals(steamApp.storePreviouslyUpdatedAt)
    )
      steamPromises.push(steamData.fetchStorePage(steamApp.id))

    if (steamApp.appType === 'game' || (steamApp.appType === 'new' && storePage?.type === 'game'))
      steamPromises.push(steamData.fetchAchievements(steamApp.id))

    try {
      let steamResponses = await Promise.all(steamPromises)

      if (!storePage)
        storePage = steamResponses.find((response) => response.endpointKey === 'app')
          ?.content as SteamStorePage
      reviews = steamResponses.find((response) => response.endpointKey === 'reviews')
        ?.content as SteamReviews
      achievements = steamResponses.find((response) => response.endpointKey === 'achievements')
        ?.content as SteamAchievement[]
    } catch (err) {
      if (err.status === 429) breeEmit.steamLimitExceeded(steamApp.id)
      else {
        steamApp.appType = 'broken'
        await steamApp.save().catch((suberr) => breeEmit.failedAccessingDatabase(suberr.message))
        breeEmit.steamUnexpectedReject(steamApp.id, err)
        continue
      }
      process.exit(1)
    }

    try {
      if (reviews)
        steamApp.reviews = {
          score: reviews.review_score,
          scoreName: reviews.review_score_desc,
          positiveCount: reviews.total_positive,
          negativeCount: reviews.total_negative,
          totalCount: reviews.total_reviews,
        }

      if (achievements)
        steamApp.achievements =
          achievements.length > 0
            ? achievements.map(
                (achievement) =>
                  ({
                    name: achievement.name,
                    description: achievement?.description ?? '',
                    hidden: achievement.hidden,
                    percent: achievement.percent,
                  }) satisfies Achievement
              )
            : []

      if (storePage) {
        steamApp.appType = storePage.type

        steamApp.storeLastlyUpdatedAt = steamApp.storeUpdatedAt
        steamApp.storePreviouslyUpdatedAt = steamApp.storeLastlyUpdatedAt

        if (storePage.type !== 'outer') {
          steamApp.parentGameId = storePage?.fullgame?.appid ?? null

          steamApp.isReleased = storePage.release_date.coming_soon
          steamApp.releaseDate = storePage.release_date.date

          steamApp.age = String(storePage.required_age)

          steamApp.platforms = {
            windows: storePage.platforms.windows,
            mac: storePage.platforms.mac,
            linux: storePage.platforms.linux,
          }
          steamApp.controller = storePage?.controller_support ?? null

          steamApp.developers = storePage.developers
          steamApp.publishers = storePage.publishers
          steamApp.categories =
            storePage?.categories && storePage.categories.length > 0
              ? storePage?.categories.map((category) => category.description)
              : []
          steamApp.genres =
            storePage?.genres && storePage.genres.length > 0
              ? storePage.genres.map((genre) => genre.description)
              : []

          steamApp.isFree = storePage.is_free
          if (storePage.price_overview) {
            steamApp.pricing = {
              priceInitial: storePage.price_overview.initial,
              priceFinal: storePage.price_overview.final,
              priceDiscount: storePage.price_overview.discount_percent,
            }
          }

          if (storePage.metacritic) {
            steamApp.metacritic = {
              score: storePage.metacritic.score,
              url: storePage.metacritic.url,
            }
          }

          steamApp.media = {
            header: storePage.header_image,
            screenshotCount: storePage?.screenshots?.length ?? 0,
            videoCount: storePage?.movies?.length ?? 0,
          }
        }
      }
    } catch (err) {
      breeEmit.steamUnexpectedError(steamApp.id, err)
      steamApp.appType = 'broken'
    }

    steamApp.isEnriched = true
    await steamApp.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
  }
}

wave.step = 'stats'
await wave.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
await discordMessage.custom('[steamData] Steam enriching done')

process.exit(0)
