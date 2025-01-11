import type { SteamEndpoint } from '#services/steam_data/types'

const steamEndpoints = {
  list: {
    route: 'https://api.steampowered.com/IStoreService/GetAppList/v1/',
    params: {
      include_games: true,
      include_dlc: true,
      include_video: false,
      include_hardware: false,
    },
    key: true,
  },
} satisfies Record<string, SteamEndpoint>

export { steamEndpoints as default }
