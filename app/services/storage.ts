import app from '@adonisjs/core/services/app'
import Flydrive from '#services/flydrive/index'

let storage: Flydrive
/**
 * Returns a singleton instance of the Database class from the
 * container
 */
await app.booted(async () => {
  storage = await app.container.make(Flydrive)
})
export { storage as default }
