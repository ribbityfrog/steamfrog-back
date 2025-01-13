import env from '#start/env'
import steamEndpoints from '#services/steam_data/endpoints'
import type { SteamEndpointKeys, SteamList } from '#services/steam_data/types'

class SteamData {
  private _apiKey = env.get('STEAM_KEY')

  async getList(last_appid: number = 0, max_results: number = 10000): Promise<SteamList | null> {
    const result = await this._buildAndFetch('list', { last_appid, max_results })

    return result?.response ?? null
  }

  async getApp(appids: number): Promise<any | null> {
    const result = await this._buildAndFetch('app', { appids })

    return result?.[String(appids)]?.data ?? null
  }

  async getReviews(gameid: number) {
    const result = await this._buildAndFetch('reviews', {}, String(gameid))

    return result?.query_summary ?? null
  }

  async getAchievements(gameid: number): Promise<any | null> {
    const [achievementsResult, schemaParsedResult] = await Promise.all([
      this._buildAndFetch('achievements', { gameid }, '', false),
      this.getSchema(gameid),
    ])

    if (achievementsResult.status === 403) return []
    else if (achievementsResult.status !== 200) return null

    const achievementsParsedResult = await achievementsResult.json()

    const achievements = achievementsParsedResult?.achievementpercentages?.achievements

    if (achievements === undefined || schemaParsedResult === null) return null

    return achievements
      .filter((achievement: any) => achievement !== null)
      .map((achievement: any) => {
        const schema = schemaParsedResult.find((s: any) => s.name === achievement.name)

        if (schema === undefined) return null

        return {
          name: schema.displayName,
          description: schema.description,
          hidden: Boolean(schema.hidden),
          percent: Math.round(achievement.percent * 100) / 100,
        }
      })
  }

  async getSchema(appid: number): Promise<any | null> {
    const result = await this._buildAndFetch('schema', { appid })

    return result?.game?.availableGameStats?.achievements ?? null
  }

  async _buildAndFetch(
    endpointKey: SteamEndpointKeys,
    optionalParams: Record<string, string | boolean | number> = {},
    extraPath: string = '',
    parse: boolean = true
  ) {
    const endpoint = this._buildEndpoint(endpointKey, optionalParams, extraPath)
    return await this._fetchEndpoint(endpoint, parse)
  }

  private async _fetchEndpoint(endpoint: string, parse: boolean = true): Promise<any | null> {
    const response = await fetch(endpoint)

    if (parse) {
      if (response.status !== 200) return null

      return await response.json()
    } else return response
  }

  private _buildEndpoint(
    endpointKey: SteamEndpointKeys,
    optionalParams: Record<string, string | boolean | number> = {},
    extraPath: string = ''
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
      extraPath +
      (params.length > 0
        ? '?' + params.map(([key, value]) => `${key}=${String(value)}`).join('&')
        : '')
    )
  }
}

const steamData = new SteamData()
export { steamData as default }
