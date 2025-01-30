import igniteApp from '#utils/ignite_worker_app'

import steamData from '#services/steam_data'

import breeEmit from '#services/bree/emitter'
import discordMessage from '#utils/discord_message'
import env from '#start/env'

import type {
  SteamAPIAchievement,
  SteamDataResponse,
  SteamAPIReviews,
  SteamAPIAppDetails,
} from '#services/steam_data/types'
import type { Achievement } from '#models/catalogues/types'
import { DateTime } from 'luxon'

const app = await igniteApp()

const { default: Catalogue } = await import('#models/catalogues/catalogue')
const { default: Wave } = await import('#models/treatments/wave')

const wave = await Wave.query()
  .orderBy('wave', 'desc')
  .where('step', 'enrich')
  .first()
  .catch(async (err) => {
    await breeEmit.failedAccessingDatabase(err.message, true)
    return null
  })
if (wave === null) {
  await app!.terminate()
  process.exit(0)
}

while (true) {
  const steamApps = await Catalogue.query()
    .where('isEnriched', false)
    .andWhereNotIn('appType', ['outer', 'broken', 'trash'])
    .orderBy('id', 'asc')
    .limit(200)
    .catch(async (err) => {
      await breeEmit.failedAccessingDatabase(err.message, true)
      return null
    })

  if (steamApps === null || steamApps?.length === 0) break

  for (const steamApp of steamApps) {
    if (env.get('NODE_ENV') !== 'production')
      console.log(`Enriching ${steamApp.name} (${steamApp.id}) - ${steamApp.storeUpdatedAt}`)

    let storePage: SteamAPIAppDetails | undefined
    let achievements: SteamAPIAchievement[] | undefined
    let reviews: SteamAPIReviews | undefined

    if (steamApp.appType === 'new') {
      const storePageResponse = await steamData.fetchAppDetails(steamApp.id, true)

      if (storePageResponse.success === true) {
        storePage = storePageResponse.content

        if (storePage?.type === 'trash') {
          steamApp.appType = 'trash'
          await steamApp
            .save()
            .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
          discordMessage.custom(`[Enrich] Trash found : ${steamApp.id}`)
          continue
        }
      } else {
        if (storePageResponse.status === 429) await breeEmit.steamLimitExceeded(steamApp.id, true)
        else if (storePageResponse.status === 200) {
          steamApp.appType = 'broken'
          await steamApp
            .save()
            .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
          await breeEmit.steamUnexpectedReject(steamApp.id, storePageResponse)
          continue
        } else await breeEmit.steamUnexpectedReject(steamApp.id, storePageResponse, true)
      }
    }

    const steamPromises: Promise<SteamDataResponse>[] = [steamData.fetchReviews(steamApp.id)]

    if (
      steamApp.appType !== 'new' &&
      !steamApp.storeUpdatedAt.equals(steamApp.storePreviouslyUpdatedAt)
    )
      steamPromises.push(steamData.fetchAppDetails(steamApp.id))

    if (steamApp.appType === 'game' || (steamApp.appType === 'new' && storePage?.type === 'game'))
      steamPromises.push(steamData.fetchAchievements(steamApp.id))

    try {
      let steamResponses = await Promise.all(steamPromises)

      if (!storePage)
        storePage = steamResponses.find((response) => response.endpointKey === 'app')
          ?.content as SteamAPIAppDetails
      reviews = steamResponses.find((response) => response.endpointKey === 'reviews')
        ?.content as SteamAPIReviews
      achievements = steamResponses.find((response) => response.endpointKey === 'achievements')
        ?.content as SteamAPIAchievement[]
    } catch (err) {
      if (err.status === 429) await breeEmit.steamLimitExceeded(steamApp.id, true)
      else {
        steamApp.appType = 'broken'
        await steamApp
          .save()
          .catch(
            async (suberr: Error) => await breeEmit.failedAccessingDatabase(suberr.message, true)
          )
        await breeEmit.steamUnexpectedReject(steamApp.id, err)
        continue
      }
    }

    try {
      if (storePage) {
        steamApp.appType = storePage.type

        steamApp.storeLastlyUpdatedAt = steamApp.storeUpdatedAt
        steamApp.storePreviouslyUpdatedAt = steamApp.storeLastlyUpdatedAt

        if (steamApp.appType)
          if (storePage.type === 'game' || storePage.type === 'dlc') {
            steamApp.parentGameId = storePage?.fullgame?.appid ?? null

            steamApp.isReleased = !storePage.release_date.coming_soon

            const releaseDate = storePage.release_date.date
            let parsedDate: DateTime | null
            if (
              !releaseDate ||
              releaseDate.length === 0 ||
              releaseDate === 'Coming soon' ||
              releaseDate === 'To be announced'
            )
              parsedDate = null
            else if (releaseDate.charAt(0) === 'Q')
              parsedDate = DateTime.local(
                +releaseDate.split(' ')[1],
                +releaseDate.charAt(1) * 3,
                1
              ).endOf('quarter')
            else if (releaseDate.split(' ').length === 1)
              parsedDate = DateTime.fromFormat(releaseDate, 'yyyy').endOf('year')
            else if (releaseDate.indexOf(',') !== -1)
              parsedDate = DateTime.fromFormat(releaseDate, 'MMM d, yyyy')
            else parsedDate = DateTime.fromFormat(releaseDate, 'MMMM yyyy').endOf('month')

            if (!parsedDate?.isValid) {
              console.log(releaseDate)
              console.log(parsedDate?.invalidReason)
            }
            steamApp.releaseDate = parsedDate?.isValid === true ? parsedDate : null

            const age = Number.parseInt(storePage?.required_age)
            steamApp.age = Number.isNaN(age) ? 0 : age

            steamApp.platforms = {
              windows: storePage.platforms.windows,
              mac: storePage.platforms.mac,
              linux: storePage.platforms.linux,
            }
            steamApp.hasControllerSupport = storePage?.controller_support === 'full' ? true : false

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
    } catch (err) {
      await breeEmit.steamUnexpectedError(steamApp.id, err)
      steamApp.appType = 'broken'
    }

    steamApp.isEnriched = true
    await steamApp
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
  }
}

wave.step = 'stats'
await wave.save().catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
await discordMessage.custom('(steamData) Steam enriching done')

await app!.terminate()
process.exit(0)
