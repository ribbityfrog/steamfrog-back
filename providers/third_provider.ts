import type { ApplicationService } from '@adonisjs/core/types'
import Brevo from '#services/brevo/index'
import Bree from '#services/bree/index'
import Flydrive from '#services/flydrive/index'
import discordMessage from '#utils/discord_message'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export default class ThirdProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton(Brevo, () => new Brevo())
    this.app.container.singleton(Bree, () => new Bree())
    this.app.container.singleton(Flydrive, () => new Flydrive())
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {
    const mailer = await this.app.container.make(Brevo)
    await mailer
      .init()
      .then()
      .catch(() => {})

    const storage = await this.app.container.make(Flydrive)
    await storage.checkInit()
  }

  /**
   * The process has been started
   */
  async ready() {
    // if (env.get('NODE_ENV', 'development') === 'production') {
    const scheduler = await this.app.container.make(Bree)
    await scheduler
      .start()
      .then()
      .catch(() => {})
    discordMessage.custom('(START-provider) Third services ready', false)
    // } else
    // logger.warn('[service] Bree not started, production only')
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
