import env from '#start/env'
import { listenerCount } from 'node:process'
import steamEndpoints from './steam_data/endpoints.js'
import type { SteamEndpointKeys } from './steam_data/types.js'

class SteamData {
  private _apiKey = env.get('STEAM_KEY')

  private _buildEndpoint(
    endpointKey: SteamEndpointKeys,
    optionalParams: Record<string, string | boolean | number> = {}
  ): string {
    const ep = steamEndpoints[endpointKey]

    const apiKey = ep.key === true ? { key: this._apiKey } : {}
    const params = Object.entries({
      ...ep.params,
      ...optionalParams,
      ...apiKey,
    })

    return (
      ep.route +
      (params.length > 0
        ? '?' + params.map(([key, value]) => `${key}=${String(value)}`).join('&')
        : '')
    )
  }

  getGame(appid: number) {
    return this._buildEndpoint('list', { appid })
  }
}

const steamData = new SteamData()
export { steamData as default }
