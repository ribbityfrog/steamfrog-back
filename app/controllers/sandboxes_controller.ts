import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'

export default class SandboxesController {
  async sand() {
    const steamApps = await SteamApp.all()

    return [steamApps.length, steamApps]
  }

  async check({ params }: HttpContext) {
    const appid = +params.appid

    if (Number.isNaN(appid)) return 'The appid is not a valid number'

    return {
      storePage: await steamData.getStorePage(params.appid),
      reviews: await steamData.getReviews(params.appid),
      achievements: await steamData.getAchievements(params.appid),
    }
  }
}
