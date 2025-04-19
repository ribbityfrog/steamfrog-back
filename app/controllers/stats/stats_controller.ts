// import type { HttpContext } from '@adonisjs/core/http'
import meng from '#services/meng'

import db from '@adonisjs/lucid/services/db'
import Catalogue from '#models/catalogues/catalogue'

export default class StatsController {
  async count() {
    return await meng.getOrSet('count', async () => await Catalogue.appsCount(true))
  }

  async maturity() {
    return await meng.getOrSet('maturity', async () => await Catalogue.maturityCount(true))
  }

  async brokens() {
    return await meng.getOrSet('brokens', async () => await Catalogue.brokens(true))
  }

  async finance() {
    return await meng.getOrSet('finance', async () => await Catalogue.finance(true))
  }

  async platforms() {}

  async dates() {}

  async global() {
    const stats = meng.getOrSet(
      'basics',
      async () =>
        await Catalogue.query()
          .select(
            db.raw(`to_char((release->>'date')::timestamp, 'YYYY-MM') as release_month`),
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
          .groupByRaw(`to_char((release->>'date')::timestamp, 'YYYY-MM')`)
          .orderByRaw(`to_char((release->>'date')::timestamp, 'YYYY-MM')`)
          .pojo()
    )

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
