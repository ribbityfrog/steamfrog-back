// import type { HttpContext } from '@adonisjs/core/http'

import db from '@adonisjs/lucid/services/db'
import Catalogue from '#models/catalogues/catalogue'

export default class StatsController {
  async global() {
    const stats = await Catalogue.query()
      .select(
        db.raw(`extract(year from (release->>'date')::timestamp) as release_year`),
        db.raw(`count(*) filter (where app_type = 'game')::integer as games_count`),
        db.raw(`count(*) filter (where app_type = 'dlc')::integer as dlcs_count`),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'windows' = 'true')::integer as games_windows_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'windows' = 'true')::integer as dlcs_windows_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'mac' = 'true')::integer as games_mac_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'mac' = 'true')::integer as dlcs_mac_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'linux' = 'true')::integer as games_linux_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'linux' = 'true')::integer as dlcs_linux_count`
        )
      )
      .whereRaw(`release->>'isReleased' = 'true'`)
      .groupByRaw(`extract(year from (release->>'date')::timestamp)`)
      .orderByRaw(`extract(year from (release->>'date')::timestamp)`)

    return stats
  }

  async undated() {
    return await Catalogue.query()
      .where('app_type', 'game')
      .select('id', 'name', 'is_free', db.raw(`pricing->>'priceFinal' as price`))
      .andWhereRaw(`release->>'isReleased' = 'true'`)
      .andWhereRaw(`release->>'date' IS NULL`)
      .orderBy('id', 'desc')
  }

  async windowsless() {
    return await Catalogue.query()
      .where('app_type', 'game')
      .select('id', 'name', 'is_free', db.raw(`pricing->>'priceFinal' as price`))
      .andWhereRaw(`release->>'isReleased' = 'true'`)
      .andWhereRaw(`platforms->>'windows' = 'false'`)
      .orderBy('id', 'desc')
  }
}
