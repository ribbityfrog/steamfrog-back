// import type { HttpContext } from '@adonisjs/core/http'

import db from '@adonisjs/lucid/services/db'
import Catalogue from '#models/catalogues/catalogue'

export default class StatsController {
  async global() {
    // return await Catalogue.query()
    //   .where('app_type', 'game')
    //   .andWhereRaw(`release->>'isReleased' = 'true'`)
    //   .andWhereRaw(`release->>'date' IS NULL`)

    const stats = await Catalogue.query()
      .select(
        db.raw(`extract(year from (release->>'date')::timestamp) as release_year`),
        db.raw(`count(*) filter (where app_type = 'game') as total_games`),
        db.raw(`count(*) filter (where app_type = 'dlc') as total_dlcs`),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'windows' = 'true') as windows_games`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'windows' = 'true') as windows_dlcs`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'mac' = 'true') as mac_games`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'mac' = 'true') as mac_dlcs`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'linux' = 'true') as linux_games`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'linux' = 'true') as linux_dlcs`
        )
      )
      .whereRaw(`release->>'isReleased' = 'true'`)
      .groupByRaw(`extract(year from (release->>'date')::timestamp)`)
      .orderByRaw(`extract(year from (release->>'date')::timestamp)`)

    return stats
  }
}
