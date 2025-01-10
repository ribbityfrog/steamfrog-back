import app from '@adonisjs/core/services/app'
import Bree from '#services/bree/index'

let scheduler: Bree
/**
 * Returns a singleton instance of the Database class from the
 * container
 */
await app.booted(async () => {
  scheduler = await app.container.make(Bree)
})
export { scheduler as default }
