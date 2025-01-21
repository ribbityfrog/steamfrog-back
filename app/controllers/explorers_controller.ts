import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'
import Wave from '#models/treatments/wave'
import db from '@adonisjs/lucid/services/db'

export default class SandboxesController {
  async progress() {
    const steamAppsExtract = await SteamApp.query()
      .where('isEnriched', true)
      .orderBy('id', 'desc')
      .limit(10)
    const steamAppsCount = await db.from(SteamApp.table).count('*')
    const enrichedAppsCount = await db.from(SteamApp.table).where('is_enriched', true).count('*')
    const brokenApps = await SteamApp.query().where('app_type', 'broken')
    const outerApps = await SteamApp.query().where('app_type', 'outer')
    const trashedApps = await SteamApp.query().where('app_type', 'trash')
    const debug = await SteamApp.query()
      .where('isEnriched', true)
      .andWhereNull('releaseDate')
      .andWhereNot('appType', 'outer')

    return {
      wave: await Wave.query().select('wave', 'step', 'last_appid').orderBy('wave', 'desc').first(),
      badApples: {
        broken: {
          count: brokenApps.length,
          list: brokenApps,
        },
        trash: {
          count: trashedApps.length,
          list: trashedApps,
        },
        outer: {
          count: outerApps.length,
          list: outerApps.map((outer) => outer.id),
        },
      },
      apps: {
        totalCount: Number(steamAppsCount[0].count),
        enriched: Number(enrichedAppsCount[0].count),
        last10Enriched: steamAppsExtract,
      },
      debug,
    }
  }

  async app({ params }: HttpContext) {
    const appid = +params.appid

    if (Number.isNaN(appid)) return 'The appid is not a valid number'

    return {
      storePage: await steamData.fetchStorePage(appid, true),
      reviews: await steamData.fetchReviews(appid, true),
      achievements: await steamData.fetchAchievements(appid, true),
      base: await SteamApp.findBy('id', appid),
    }
  }

  async stats() {
    const totals = await SteamApp.statsTotals()
    const games = await SteamApp.statsGames()
    const platforms = await SteamApp.statsPlatforms()
    const notOnWindows = await SteamApp.notOnWindows()

    return { totals, games, platforms, notOnWindows }
  }

  async edit() {
    if (env.get('NODE_ENV', 'production') !== 'development') return 'no edit in production'

    // const sApp = await SteamApp.findBy('id', 774161)
    // if (!sApp) return 'nothing to edit'

    // sApp.isEnriched = false
    // sApp.appType = 'new'
    // await sApp.save()

    // return sApp
  }
}
