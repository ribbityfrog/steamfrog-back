import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'
import Wave from '#models/treatments/wave'

export default class SandboxesController {
  async sand() {
    const steamApps = await SteamApp.all()

    return [await Wave.query().select('wave', 'step', 'last_appid'), steamApps.length, steamApps]
  }

  async check({ params }: HttpContext) {
    const appid = +params.appid

    if (Number.isNaN(appid)) return 'The appid is not a valid number'

    return {
      storePage: await steamData.fetchStorePage(params.appid, true),
      reviews: await steamData.fetchReviews(params.appid, true),
      achievements: await steamData.fetchAchievements(params.appid, true),
    }
  }
}
