import app from '@adonisjs/core/services/app'
import Brevo from '#services/brevo/index'

let mailer: Brevo
/**
 * Returns a singleton instance of the Database class from the
 * container
 */
await app.booted(async () => {
  mailer = await app.container.make(Brevo)
})
export { mailer as default }
