import env from '#start/env'
import steamEndpoints from '#services/steam_data/endpoints'
import type { SteamEndpointKeys, SteamList } from '#services/steam_data/types'

class SteamData {
  private _apiKey = env.get('STEAM_KEY')

  async getList(last_appid: number = 0, max_results: number = 10000): Promise<SteamList | null> {
    if (last_appid !== 0) Promise.reject('nope')

    const endpoint = this._buildEndpoint('list', { last_appid, max_results })
    const parsedResult = await this._fetchEndpoint(endpoint)

    if (parsedResult === null) return null

    return parsedResult.response
  }

  private async _fetchEndpoint(endpoint: string): Promise<any | null> {
    const response = await fetch(endpoint)

    if (response.status !== 200) return null

    return await response.json()
  }

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
}

const steamData = new SteamData()
export { steamData as default }
