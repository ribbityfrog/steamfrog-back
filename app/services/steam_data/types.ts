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

interface SteamAPIVisibleStoreItem {
  type: 0 | 4
  success: 1
  visible: true
  is_free?: boolean
  related_items?: {
    demo_appid?: number[]
    parent_appid?: number
  }
  tagids?: number[]
  categories?: {
    supported_player_categoryids?: number[]
    feature_categoryids?: number[]
    controller_categoryids?: number[]
  }
  basic_info: {
    short_description?: string
    publishers?: { name: string }[]
    developers?: { name: string }[]
    franchises?: { name: string }[]
  }
  release: {
    steam_release_date?: number
    is_coming_soon?: boolean
    is_early_access?: boolean
    // coming_soon_display?: 'date_year' | 'date_quarter' | 'date_month' | 'date_full' | string
  }
  platforms: Record<string, boolean | Record<string, boolean>> & {
    steam_deck_compat_category: number
  }
  game_rating?: {
    type: string
    rating: string
    descriptors: string[]
    required_age: number
    use_age_gate: boolean
  }
  best_purchase_option?: {
    final_price_in_cents: string
    original_price_in_cents?: string
    discount_pct?: number
  }
  screenshots?: {
    all_ages_screenshots?: unknown[]
  }
  trailers?: {
    highlights?: unknown[]
  }
  supported_languages?: {
    elanguage: number
    supported: boolean
    full_audio: boolean
    subtitles: boolean
  }[]
}

interface SteamAPIHiddenStoreItem {
  type?: Exclude<number, 0 | 4>
  success?: Exclude<number, 1>
  visible: false
  unvailable_for_country_restriction?: true
}

export type SteamAPIStoreItem = { item_type: number; id: number; appid: number; name: string } & (
  | SteamAPIHiddenStoreItem
  | SteamAPIVisibleStoreItem
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
