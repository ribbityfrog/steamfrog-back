// import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'

export default class SandboxesController {
  async sand() {
    const steamApps = await SteamApp.all()

    return [steamApps.length, steamApps.slice(0, 10)]
  }
}
