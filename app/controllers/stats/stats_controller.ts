// import type { HttpContext } from '@adonisjs/core/http'
import meng from '#services/meng'

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

  async platforms() {
    return await meng.getOrSet('platforms', async () => await Catalogue.platforms(true))
  }

  async schedule() {
    return await meng.getOrSet('shedule', async () => await Catalogue.schedule(true))
  }

  async windowsless() {
    return await meng.getOrSet('windowsless', async () => await Catalogue.windowsless(true))
  }
}
