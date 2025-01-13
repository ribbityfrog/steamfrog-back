import { Ignitor } from '@adonisjs/core'
import { ApplicationService } from '@adonisjs/core/types'

export default async (rootUrl: URL | string): Promise<ApplicationService | null> => {
  const appRoot = typeof rootUrl === 'string' ? new URL(rootUrl) : rootUrl

  try {
    const app = new Ignitor(new URL(appRoot)).createApp('repl')
    await app.init()
    await app.boot()
    if (!app.booted) return null

    await app.start(() => {})
    if (!app.isReady) return null

    return app
  } catch (error) {
    console.error('App Ignition failed', error)
    return null
  }
}
