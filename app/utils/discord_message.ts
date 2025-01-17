import { SteamDataReject } from '#services/steam_data/types'
import env from '#start/env'

class DiscordMessage {
  #webhook = env.get('DISCORD_WEBHOOK')

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

  async custom(message: string): Promise<void> {
    await this.#post(message)
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
