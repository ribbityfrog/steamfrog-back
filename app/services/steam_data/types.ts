import steamEndpoints from '#services/steam_data/endpoints'

export type SteamEndpoint = {
  route: string
  key: boolean
} & (
  | {
      params: Record<string, string | boolean | number | Object>
      stringify: true
    }
  | {
      params: Record<string, string | boolean | number>
      stringify?: false | undefined
    }
)

export type SteamEndpointKeys = keyof typeof steamEndpoints

export interface SteamDataReject {
  success: false
  status: number
  statusText: string
  endpointKey: SteamEndpointKeys
  description?: string
}

export interface SteamDataResponse<T = unknown> {
  success: true
  endpointKey: SteamEndpointKeys
  content: T
}

export type SteamDataResponseOrReject<T, B extends boolean> = B extends true
  ? SteamDataResponse<T> | SteamDataReject
  : SteamDataResponse<T>

type SteamAPIStoreListItem = {
  appid: number
  name: string
  last_modified: number
}
export type SteamAPIStoreList = {
  apps: SteamAPIStoreListItem[]
  have_more_results?: boolean
  last_appid?: number
}

export type SteamAPICategory = {
  categoryid: number
  type: number
  display_name: string
  image_url: string
  edit_sort_order: number
}

export type SteamAPITag = {
  tagid: number
  name: string
}

export type SteamAPIReviews = {
  review_score: number
  review_score_desc: string
  total_positive: number
  total_negative: number
  total_reviews: number
}

export type SteamAPIAchievement = {
  name: string
  description?: string
  hidden: boolean
  percent: number
}

export type SteamAPIAchievementSchema = {
  displayName: string
  description: string
  hidden: boolean
}

export function convertStringToAppType(appType: string): appType is 'game' | 'dlc' | 'outer' {
  return ['game', 'dlc', 'outer'].includes(appType)
}

export type SteamAPIStoreItem = { item_type: number; id: number; name: string } & (
  | { visible: false; unvailable_for_country_restriction?: true; success?: Exclude<number, 1> }
  | {
      success: 1
      visible: true
      tagids?: number[]
    }
)

export type SteamAPIAppDetails =
  | { type: 'outer' | 'trash' | 'broken' }
  | {
      type: 'game' | 'dlc'
      fullgame?: {
        appid: number
      }
      name: string
      required_age: string
      controller_support?: string
      is_free: boolean | null
      header_image: string
      developers: string[]
      publishers: string[]
      price_overview?: {
        initial: number
        final: number
        discount_percent: number
      }
      platforms: {
        windows: boolean
        mac: boolean
        linux: boolean
      }
      metacritic?: {
        score: number
        url: string
      }
      categories?: [
        {
          id: number | string
          description: string
        },
      ]
      genres?: [
        {
          id: number | string
          description: string
        },
      ]
      screenshots: any[]
      movies: any[]
      release_date: {
        coming_soon: boolean
        date: string
      }
    }
