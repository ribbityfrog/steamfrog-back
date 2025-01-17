import { Ignitor } from '@adonisjs/core'
import { ApplicationService } from '@adonisjs/core/types'
import { AppEnvironments } from '@adonisjs/core/types/app'
import discordMessage from '#utils/discord_message'

export default async (
  rootUrl: URL | string,
  environment: AppEnvironments = 'repl'
): Promise<ApplicationService | null> => {
  const appRoot = typeof rootUrl === 'string' ? new URL(rootUrl) : rootUrl

  try {
    const app = new Ignitor(new URL(appRoot)).createApp(environment)
    await app.init()
    await app.boot()
    if (!app.booted) return null

    await app.start(() => {})
    if (!app.isReady) return null

    return app
  } catch (error) {
    await discordMessage.custom('App Ignition failed')
    // console.error('App Ignition failed', error)
    return null
  }
}
