import { Ignitor } from '@adonisjs/core'
import { ApplicationService } from '@adonisjs/core/types'
import { AppEnvironments } from '@adonisjs/core/types/app'
import discordMessage from '#utils/discord_message'

import { isMainThread, workerData } from 'node:worker_threads'

export default async (
  environment: AppEnvironments = 'repl'
): Promise<ApplicationService | null> => {
  const rootUrl = workerData.appRootString

  if (isMainThread || !rootUrl) return null

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
    await discordMessage.custom(`App Ignition failed\n Message: ${error.message}`)
    process.exit(1)
  }
}

// const app = await igniteApp(workerData.appRootString)
// export { app as default }
