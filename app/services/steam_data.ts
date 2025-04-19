import env from '#start/env'
import steamEndpoints from '#services/steam_data/endpoints'
import type {
  SteamEndpoint,
  SteamAPIAchievement,
  SteamAPIAchievementSchema,
  SteamDataReject,
  SteamEndpointKeys,
  SteamDataResponseOrReject,
  SteamAPIReviews,
  SteamAPIStoreList,
  SteamAPIAppDetails,
  SteamAPIStoreItem,
  SteamAPICategory,
  SteamAPITag,
} from '#services/steam_data/types'
import { convertStringToAppType } from '#services/steam_data/types'
import discordMessage from '#utils/discord_message'

class SteamData {
  private _apiKey = env.get('STEAM_KEY')

  async fetchStoreList<B extends boolean = false>(
    last_appid: number = 0,
    max_results: number = 10000,
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIStoreList, B>> {
    const result = await this._fetch('list', { last_appid, max_results }, isThrowSafe)

    const data = result.data?.response ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'list', content: data }
  }

  async fetchCategories<B extends boolean = false>(
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPICategory[], B>> {
    const result = await this._fetch('categories', {}, isThrowSafe)

    const data = result.data?.response?.categories ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'categories', content: data }
  }

  async fetchTags<B extends boolean = false>(
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPITag[], B>> {
    const result = await this._fetch('tags', {}, isThrowSafe)

    const data = result.data?.response?.tags ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'tags', content: data }
  }

  async fetchAppDetails<B extends boolean = false>(
    appids: number,
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIAppDetails, B>> {
    let result = await this._fetch('app', { appids }, isThrowSafe)

    if (result.data?.[String(appids)]?.success === false)
      return {
        success: true,
        endpointKey: 'app',
        content: { type: 'outer' },
      }

    const data = result.data?.[String(appids)]?.data ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    if (convertStringToAppType(data.type) === false)
      return { success: true, endpointKey: 'app', content: { type: 'trash' } }

    return {
      success: true,
      endpointKey: 'app',
      content: data,
    }
  }

  async fetchStoreItem<B extends boolean = false>(
    appids: number[],
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIStoreItem[], B>> {
    const mappedAppids = appids.map((appid) => ({ appid }))

    const result = await this._fetch('item', { ids: mappedAppids }, isThrowSafe)
    const data = result.data?.response?.store_items ?? null
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return {
      success: true,
      endpointKey: 'item',
      content: data,
    }
  }

  async fetchReviews<B extends boolean = false>(
    gameid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIReviews, B>> {
    const result = await this._fetch('reviews', {}, isThrowSafe, String(gameid))

    let data = result.data?.query_summary ?? null
    if (
      data &&
      (data.review_score === undefined ||
        data.total_positive === undefined ||
        data.total_negative === undefined ||
        data.total_reviews === undefined)
    ) {
      data = undefined
      discordMessage.custom(`SteamData: unfiltered reviews failed for ${gameid}.`)
    }
    if (data === null) return this._issueHandler(result, isThrowSafe, 'Excepted data not found')

    return { success: true, endpointKey: 'reviews', content: data }
  }

  async fetchAchievements<B extends boolean = false>(
    gameid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIAchievement[], B>> {
    const schemas = await this.fetchAchievementSchema(gameid, true)

    if (schemas.success === false) {
      if (isThrowSafe) return schemas as SteamDataResponseOrReject<any, B>
      else throw schemas
    } else if (schemas.content.length === 0)
      return { success: true, endpointKey: 'achievements', content: [] }

    const achievementsResult = await this._fetch('achievements', { gameid }, isThrowSafe)

    const achievements = achievementsResult.data?.achievementpercentages?.achievements

    if (achievements === null)
      return this._issueHandler(achievements, isThrowSafe, 'Achievements not found')
    else if (achievements.length === 0)
      return { success: true, endpointKey: 'achievements', content: [] }

    return {
      success: true,
      endpointKey: 'achievements',
      content: achievements
        .filter((achievement: any) => achievement !== null)
        .map((achievement: any) => {
          if (!achievement) return null

          const schema = schemas.content.find((s: any) => s.name === achievement.name)

          if (schema === undefined) return null

          return {
            name: schema.displayName,
            description: schema.description,
            hidden: Boolean(schema.hidden),
            percent: Number.parseFloat(achievement.percent) * 10,
          } satisfies SteamAPIAchievement
        })
        .filter((achievement: any) => achievement),
    }
  }

  async fetchAchievementSchema<B extends boolean = false>(
    appid: number,
    isThrowSafe: B = false as B
  ): Promise<SteamDataResponseOrReject<SteamAPIAchievementSchema[], B>> {
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
    optionalParams: Record<string, string | boolean | number | Object> = {},
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

      try {
        return { endpointKey, response, data: await response.json() }
      } catch (err) {
        console.log(err.message)
        return { endpointKey, response, data: null }
      }
    } else return { endpointKey, response, data: undefined }
  }

  private _buildEndpoint(
    endpointKey: SteamEndpointKeys,
    optionalParams: Record<string, string | boolean | number | Object> = {},
    extraPath: string = ''
  ): string {
    const ep: SteamEndpoint = steamEndpoints[endpointKey]

    const apiKey = ep.key === true ? { key: this._apiKey } : {}

    let params: [string, string][] = []
    if (ep?.stringify === true) {
      const jsonParams = {
        ...ep.params,
        ...optionalParams,
      }

      params = Object.entries({
        ...{ input_json: encodeURIComponent(JSON.stringify(jsonParams)) },
        ...apiKey,
      })
    } else {
      params = Object.entries({
        ...ep.params,
        ...optionalParams,
        ...apiKey,
      })
    }

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
  ): SteamDataResponseOrReject<any, B> {
    const reason: SteamDataReject = {
      success: false,
      status: issue.response.status,
      statusText: issue.response.statusText,
      endpointKey: issue.endpointKey,
      description,
    }

    if (isThrowSafe === true) return reason as SteamDataResponseOrReject<unknown, B>
    throw reason
  }
}

const steamData = new SteamData()
export { steamData as default }
