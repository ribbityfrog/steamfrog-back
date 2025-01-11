// import type { HttpContext } from '@adonisjs/core/http'

// import mailer from '#services/mailer'
import steamData from '#services/steam_data'

export default class SandboxesController {
  async sand() {
    return steamData.getGame(20)
  }
}
