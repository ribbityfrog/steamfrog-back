import env from '#start/env'
import steamEndpoints from '#services/steam_data/endpoints'
import type {
  SteamAchievement,
  SteamAchievementSchema,
  SteamDataReject,
  SteamEndpointKeys,
  SteamResponseOrReject,
  SteamReviews,
  SteamStoreList,
  SteamStorePage,
} from '#services/steam_data/types'

class SteamData {
  private _apiKey = env.get('STEAM_KEY')

  async getStoreList<B extends boolean = false>(
    last_appid: number = 0,
    max_results: number = 10000,
    isThrowSafe: B = false as B
  ): Promise<SteamResponseOrReject<SteamStoreList, B>> {
    const result = await this._fetch('list', { last_appid, max_results }, isThrowSafe)

    const data = result.data?.response ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'list', content: data }
  }

  async getStorePage<B extends boolean = false>(
    appids: number,
    isThrowSafe: B = false as B
  ): Promise<SteamResponseOrReject<SteamStorePage, B>> {
    let result = await this._fetch('app', { appids }, isThrowSafe)

    if (result.data?.[String(appids)]?.success === false)
      return {
        success: true,
        endpointKey: 'app',
        content: { type: 'outer' },
      }

    const data = result.data?.[String(appids)]?.data ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return {
      success: true,
      endpointKey: 'app',
      content: data,
    }
  }

  async getReviews<B extends boolean = false>(
    gameid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamResponseOrReject<SteamReviews, B>> {
    const result = await this._fetch('reviews', {}, isThrowSafe, String(gameid))

    const data = result.data?.query_summary ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'reviews', content: data }
  }

  async getAchievements<B extends boolean = false>(
    gameid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamResponseOrReject<SteamAchievement[], B>> {
    // const [achievementsResult, schemas] = await Promise.all([
    //   this._fetch('achievements', { gameid }, isThrowSafe),
    //   this.getAchievementSchema(gameid, true),
    // ])
    const schemas = await this.getAchievementSchema(gameid, true)

    if (schemas.success === false) {
      if (isThrowSafe) return schemas as SteamResponseOrReject<any, B>
      else throw schemas
    } else if (schemas.content.length === 0)
      return { success: true, endpointKey: 'achievements', content: [] }

    const achievementsResult = await this._fetch('achievements', { gameid }, isThrowSafe)

    const achievements = achievementsResult.data?.achievementpercentages?.achievements

    if (achievements === null)
      return this._issueHandler(achievements, isThrowSafe, 'Achievements not found')
    else if (achievements.length === 0)
      return { success: true, endpointKey: 'achievements', content: [] }

    return achievements
      .filter((achievement: any) => achievement !== null)
      .map((achievement: any) => {
        const schema = schemas.content.find((s: any) => s.name === achievement.name)

        if (schema === undefined) return null

        return {
          name: schema.displayName,
          description: schema.description,
          hidden: Boolean(schema.hidden),
          percent: Math.round(achievement.percent * 100) / 100,
        } satisfies SteamAchievement
      })
  }

  async getAchievementSchema<B extends boolean = false>(
    appid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamResponseOrReject<SteamAchievementSchema[], B>> {
    const result = await this._fetch('schema', { appid }, isThrowSafe)

    const data = result.data?.game?.availableGameStats?.achievements ?? []

    return {
      success: true,
      endpointKey: 'schema',
      content: data,
    }
  }

  private async _fetch(
    endpointKey: SteamEndpointKeys,
    optionalParams: Record<string, string | boolean | number> = {},
    safe: boolean = false,
    extraPath: string = '',
    parse: boolean = true
  ) {
    const endpoint = this._buildEndpoint(endpointKey, optionalParams, extraPath)
    return await this._fetchEndpoint(endpoint, parse, safe, endpointKey)
  }

  private async _fetchEndpoint(
    endpoint: string,
    parse: boolean = true,
    safe: boolean = false,
    endpointKey: SteamEndpointKeys
  ): Promise<{ endpointKey: SteamEndpointKeys; response: Response; data: any }> {
    const response = await fetch(endpoint)

    if (parse) {
      if (response.status !== 200) {
        if (safe) return { endpointKey, response, data: null }
        else
          throw {
            success: false,
            status: response.status,
            statusText: response.statusText,
            endpointKey,
          } satisfies SteamDataReject
      }

      return { endpointKey, response, data: await response.json() }
    } else return { endpointKey, response, data: undefined }
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

  private _issueHandler<B extends boolean>(
    issue: { endpointKey: SteamEndpointKeys; response: Response; data: any },
    isThrowSafe: B,
    description: string = 'none'
  ): SteamResponseOrReject<any, B> {
    const reason: SteamDataReject = {
      success: false,
      status: issue.response.status,
      statusText: issue.response.statusText,
      endpointKey: issue.endpointKey,
      description,
    }

    if (isThrowSafe === true) return reason as SteamResponseOrReject<unknown, B>
    throw reason
  }
}

const steamData = new SteamData()
export { steamData as default }
