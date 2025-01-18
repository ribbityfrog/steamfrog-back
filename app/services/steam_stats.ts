import SteamApp from '#models/catalogues/steam_app'
import db from '@adonisjs/lucid/services/db'

class SteamStats {
  async statsPlatforms() {
    const [platforms] = await db
      .from(SteamApp.table)
      .where('is_enriched', true)
      .andWhere((query) => {
        query.where('app_type', 'game').orWhere('app_type', 'dlc')
      })
      .select(
        db.raw(`
                jsonb_build_object(
                  'game', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
                  ),
                  'dlc', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
                  )
                ) AS windows,
                jsonb_build_object(
                  'game', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
                    ),
                  'dlc', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
                  )
                ) AS mac,
                jsonb_build_object(
                  'game', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
                  ),
                  'dlc', jsonb_build_object(
                    'count', COUNT(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                    'priceInitial', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                    'priceFinal', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
                  )
                ) AS linux
            `)
      )

    return platforms
  }
}

const steamStats = new SteamStats()
export { steamStats as default }
