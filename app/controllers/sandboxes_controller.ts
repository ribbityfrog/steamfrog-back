// import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'
import steamData from '#services/steam_data'

export default class SandboxesController {
  async sand() {
    // const achievements = await steamData.getAchievements(570)
    // return achievements
    return await SteamApp.findBy('id', 80)
    // return await steamData.getReviews(1868140)
    // return await steamData.getStorePage(220)
    // const steamApps = await SteamApp.all()
    // return [steamApps.length, steamApps]
  }
}
