// import type { HttpContext } from '@adonisjs/core/http'

import SteamApp from '#models/catalogues/steam_app'

export default class SandboxesController {
  async sand() {
    return SteamApp.all()
  }
}
