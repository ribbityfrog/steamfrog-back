import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'
import Wave from '#models/treatments/wave'
import db from '@adonisjs/lucid/services/db'

export default class SandboxesController {
  async progress() {
    const steamApps = await SteamApp.all()
    const enrichedApps = await db.from(SteamApp.table).where('is_enriched', true).count('*')
    const brokenApps = await SteamApp.query().where('app_type', 'broken')
    const outerApps = await SteamApp.query().where('app_type', 'outer')
    const debug = await SteamApp.query()
      .where('isEnriched', true)
      .andWhereNull('releaseDate')
      .andWhereNot('appType', 'outer')

    return {
      wave: await Wave.query().select('wave', 'step', 'last_appid').orderBy('wave', 'desc').first(),
      enriched: enrichedApps[0].count,
      broken: {
        count: brokenApps.length,
        list: brokenApps,
      },
      outer: {
        count: outerApps.length,
        list: outerApps,
      },
      apps: {
        count: steamApps.length,
        list: steamApps,
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
}
