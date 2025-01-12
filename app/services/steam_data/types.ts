import steamEndpoints from '#services/steam_data/endpoints'

export type SteamEndpoint = {
  route: string
  params: Record<string, string | boolean | number>
  key: boolean
}

export type SteamEndpointKeys = keyof typeof steamEndpoints

type SteamListItem = {
  appid: number
  name: string
  last_modified: number
}
export type SteamList = {
  apps: SteamListItem[]
  have_more_results?: boolean
  last_appid?: number
}
