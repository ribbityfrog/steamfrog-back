import steamEndpoints from '#services/steam_data/endpoints'

export type SteamEndpoint = {
  route: string
  params: Record<string, string | boolean | number>
  key: boolean
}

export type SteamEndpointKeys = keyof typeof steamEndpoints

type SteamStoreListItem = {
  appid: number
  name: string
  last_modified: number
}
export type SteamStoreList = {
  apps: SteamStoreListItem[]
  have_more_results?: boolean
  last_appid?: number
}

export type SteamAchievement = {
  name: string
  description?: string
  hidden: boolean
  percent: number
}

export type SteamReviews = {
  review_score: number
  review_score_desc: string
  total_positive: number
  total_negative: number
  total_reviews: number
}

export type SteamStorePage = {
  type: 'game' | 'dlc'
  name: string
  required_age: number | string
  controller_support?: string
  is_free: boolean
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
  categories: [
    {
      id: number | string
      description: string
    },
  ]
  genres: [
    {
      id: number | string
      description: string
    },
  ]
  screenshots: any[]
  movies: any[]
  release_date: {
    coming_soon: boolean
    date: number
  }
}
