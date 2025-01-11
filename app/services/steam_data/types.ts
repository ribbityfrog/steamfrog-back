import steamEndpoints from '#services/steam_data/endpoints'

export type SteamEndpoint = {
  route: string
  params: Record<string, string | boolean | number>
  key: boolean
}

export type SteamEndpointKeys = keyof typeof steamEndpoints
