import { SteamDataReject } from '#services/steam_data/types'
import env from '#start/env'
import { ExceptIntels } from '#utils/except/types'

class DiscordMessage {
  #webhook = env.get('DISCORD_WEBHOOK')
  #headtext = `[steamy-api_${env.get('NODE_ENV')}] `
  #nodeEnv = env.get('NODE_ENV')

  async exceptError(logs: {
    intels: ExceptIntels
    aborted: boolean
    debug?: any
    url?: string
    stack?: string
  }): Promise<void> {
    let debugMessage = ''

    if (typeof logs?.debug?.message === 'string') debugMessage = logs?.debug?.message
    else if (typeof logs?.debug === 'string') debugMessage = logs?.debug
    else debugMessage = 'none'

    await this.custom(
      `[Except] ${logs.intels.status} (${logs.intels.code})}
      Critial: ${logs.intels.critical} - Aborted: ${logs.aborted}
      Message: ${debugMessage}
      Debug message: ${typeof logs.debug === 'string' ? logs.debug : 'none'}
      URL: ${logs?.url}`
    )
  }

  async steamReject(steamReject: SteamDataReject | undefined, workerName?: string): Promise<void> {
    const message = !steamReject
      ? `[steamApp] Unexpected reject in ${workerName ?? 'unknown worker'}`
      : `[steamApp] Unexpected reject in ${workerName}\n ${steamReject.status} in ${steamReject.endpointKey} - ${steamReject.statusText}\n ${steamReject.description}`

    await this.custom(message)
  }

  async steamError(
    steamError: { gameid: number; message: string } | undefined,
    workerName?: string
  ): Promise<void> {
    const message = !steamError
      ? `[steamApp] Unexpected error in ${workerName ?? 'unknown worker'}`
      : `[steamApp] Unexpected error in ${workerName}\n gameid(${steamError.gameid}) - ${steamError.message}`

    await this.custom(message)
  }

  async custom(message: string, preprod: boolean = true): Promise<void> {
    if (preprod === false && this.#nodeEnv !== 'production') return

    await this.#post(this.#headtext + message)
  }

  async #post(message: string): Promise<void> {
    await fetch(this.#webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })
  }
}

const discordMessage = new DiscordMessage()
export { discordMessage as default }
