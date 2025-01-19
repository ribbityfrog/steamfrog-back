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
    const [total] = await db
      .from(SteamApp.table)
      .where('is_enriched', true)
      .select(
        db.raw(`
      (COUNT(CASE WHEN app_type = 'game' THEN 1 END))::integer AS game_count,
      (COUNT(CASE WHEN app_type = 'dlc' THEN 1 END))::integer AS dlc_count,
      (COUNT(CASE WHEN app_type = 'outer' THEN 1 END))::integer AS outer_count,
      (SUM((pricing->>'priceInitial')::numeric) / 100)::integer AS price_initial_sum,
      (SUM((pricing->>'priceFinal')::numeric) / 100)::integer AS price_final_sum
      `)
      )

    const platforms = await SteamApp.statsPlatforms()

    return { total, platforms }
  }

  async edit() {
    if (env.get('NODE_ENV', 'production') !== 'development') return

    const sApp = await SteamApp.findBy('id', 473930)
    if (!sApp) return

    sApp.isEnriched = true
    await sApp.save()
  }
}
