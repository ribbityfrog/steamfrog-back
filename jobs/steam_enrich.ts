import { workerData } from 'node:worker_threads'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import igniteApp from '#utils/ignite_app'
import breeEmit from '#services/bree/emitter'
import type {
  SteamAchievement,
  SteamDataReject,
  SteamDataResponse,
  SteamReviews,
  SteamStorePage,
} from '#services/steam_data/types'
import { Achievement } from '#models/catalogues/types'

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms))

const app = await igniteApp(workerData.appRootString)
if (app === null) breeEmit.failedIgnitingApp()

const checkWave = await Wave.query()
  .orderBy('wave', 'desc')
  .where('step', 'enrich')
  .first()
  .catch((err) => {
    breeEmit.failedAccessingDatabase(err.message)
    return null
  })
if (checkWave === null) breeEmit.done()
const wave = checkWave!

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

    // let storePage: SteamStorePage | undefined | null
    // let achievements: SteamAchievement[] | undefined | null
    // let reviews: SteamReviews | undefined | null

    let storePage: SteamStorePage | undefined

    try {
      let storePageResponse = await steamData.getStorePage(steamApp.id)

      storePage = storePageResponse.content
    } catch (err) {
      const reason = err as SteamDataReject
      console.log(reason)
    }

    console.log(storePage?.type)

    await timer(1000)
    breeEmit.done()

    if (steamApp.appType === 'new')
      if (
        steamApp.appType === 'new' ||
        !steamApp.storeUpdatedAt.equals(steamApp.storePreviouslyUpdatedAt)
      ) {
        if (steamApp.appType === 'new') {
          storePage = await steamData.getStorePage(steamApp.id)

          if (storePage === null) breeEmit.steamLimitExceeded(steamApp.id)
          else {
            if (storePage.type === 'game')
              [reviews, achievements] = await Promise.all([
                steamData.getReviews(steamApp.id),
                steamData.getAchievements(steamApp.id),
              ])
            else if (storePage.type === 'dlc') reviews = await steamData.getReviews(steamApp.id)
          }
        } else if (steamApp.appType === 'game')
          [storePage, reviews, achievements] = await Promise.all([
            steamData.getStorePage(steamApp.id),
            steamData.getReviews(steamApp.id),
            steamData.getAchievements(steamApp.id),
          ])
        else if (steamApp.appType === 'dlc')
          [storePage, reviews] = await Promise.all([
            steamData.getStorePage(steamApp.id),
            steamData.getReviews(steamApp.id),
          ])
      } else {
        if (steamApp.appType === 'dlc') reviews = await steamData.getReviews(steamApp.id)
        else if (steamApp.appType === 'game')
          [reviews, achievements] = await Promise.all([
            steamData.getReviews(steamApp.id),
            steamData.getAchievements(steamApp.id),
          ])
      }

    if (storePage === null || reviews === null || achievements === null)
      breeEmit.steamLimitExceeded(steamApp.id)

    if (reviews)
      steamApp.reviews = {
        score: reviews.review_score,
        scoreName: reviews.review_score_desc,
        positiveCount: reviews.total_positive,
        negativeCount: reviews.total_negative,
        totalCount: reviews.total_reviews,
      }

    if (achievements)
      achievements.map(
        (achievement) =>
          ({
            name: achievement.name,
            description: achievement?.description ?? '',
            hidden: achievement.hidden,
            percent: achievement.percent,
          }) satisfies Achievement
      )

    if (storePage) {
      steamApp.appType = storePage.type

      if (storePage.type !== 'outer') {
        steamApp.parentGameId = storePage?.fullgame?.appid ?? null

        steamApp.storePreviouslyUpdatedAt = steamApp.storeLastlyUpdatedAt
        steamApp.storeLastlyUpdatedAt = steamApp.storeUpdatedAt

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
        steamApp.categories = storePage.categories.map((category) => category.description)
        steamApp.genres =
          storePage?.genres === undefined ? [] : storePage.genres.map((genre) => genre.description)

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

    steamApp.isEnriched = true
    await steamApp.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
  }
}

wave.step = 'stats'
await wave.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))

breeEmit.done()
