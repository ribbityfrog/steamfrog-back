import type { HttpContext } from '@adonisjs/core/http'

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
    const debug = await SteamApp.query()
      .where('isEnriched', true)
      .andWhereNull('releaseDate')
      .andWhereNot('appType', 'outer')

    return {
      wave: await Wave.query().select('wave', 'step', 'last_appid').orderBy('wave', 'desc').first(),
      broken: {
        count: brokenApps.length,
        list: brokenApps,
      },
      outer: {
        count: outerApps.length,
        list: outerApps,
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

  // const results = await Database
  // .from('your_table_name')
  // .select(Database.raw(`
  //     SUM(price) AS total_price,
  //     SUM(CASE WHEN os->>'windows' = 'true' THEN price ELSE 0 END) AS total_windows,
  //     SUM(CASE WHEN os->>'mac' = 'true' THEN price ELSE 0 END) AS total_mac,
  //     SUM(CASE WHEN os->>'linux' = 'true' THEN price ELSE 0 END) AS total_linux,
  //     COUNT(CASE WHEN app_type = 'game' THEN 1 END) AS game_count
  // `));
  async stats() {
    const [total] = await db
      .from(SteamApp.table)
      .where('is_enriched', true)
      .select(
        db.raw(`
      CAST(COUNT(CASE WHEN app_type = 'game' THEN 1 END) AS INTEGER) AS game_count,
      CAST(COUNT(CASE WHEN app_type = 'dlc' THEN 1 END) AS INTEGER) AS dlc_count,
      CAST(COUNT(CASE WHEN app_type = 'outer' THEN 1 END) AS INTEGER) AS outer_count,
      CAST(SUM((pricing->>'priceInitial')::NUMERIC) / 100 AS INTEGER) AS price_initialSum,
      CAST(SUM((pricing->>'priceFinal')::NUMERIC) / 100 AS INTEGER) AS price_finalSum
      `)
      )

    const [platforms] = await db
      .from(SteamApp.table)
      .where('is_enriched', true)
      .select(
        db.raw(`
        CAST(COUNT(CASE WHEN (platforms->>'windows')::BOOLEAN IS true AND app_type = 'game' THEN 1 END) AS INTEGER) AS windows_game_count,
        CAST(COUNT(CASE WHEN (platforms->>'windows')::BOOLEAN IS true AND app_type = 'dlc' THEN 1 END) AS INTEGER) AS windows_dlc_count,
        CAST(COUNT(CASE WHEN (platforms->>'mac')::BOOLEAN IS true AND app_type = 'game' THEN 1 END) AS INTEGER) AS mac_game_count,
        CAST(COUNT(CASE WHEN (platforms->>'mac')::BOOLEAN IS true AND app_type = 'dlc' THEN 1 END) AS INTEGER) AS mac_dlc_count,
        CAST(COUNT(CASE WHEN (platforms->>'linux')::BOOLEAN IS true AND app_type = 'game' THEN 1 END) AS INTEGER) AS linux_game_count,
        CAST(COUNT(CASE WHEN (platforms->>'linux')::BOOLEAN IS true AND app_type = 'dlc' THEN 1 END) AS INTEGER) AS linux_dlc_count
      `)
      )

    return { total, platforms }
  }
}
