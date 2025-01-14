// import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'

export default class SandboxesController {
  async sand() {
    // return await steamData.getAchievements(1868140)
    // return await steamData.getReviews(1868140)
    return await steamData.getStorePage(1250410)
    // const steamApps = await SteamApp.all()

    // return [steamApps.length, steamApps.slice(0, 10)]
  }
}
