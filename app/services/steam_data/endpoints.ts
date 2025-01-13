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
  app: {
    route: 'https://store.steampowered.com/api/appdetails/',
    params: { cc: 'us' },
    key: false,
  },
  reviews: {
    route: 'https://store.steampowered.com/appreviews/',
    params: { json: 1, language: 'all' },
    key: false,
  },
  achievements: {
    route: 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/',
    params: {
      json: 1,
    },
    key: false,
  },
  schema: {
    route: 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2',
    params: {},
    key: true,
  },
} satisfies Record<string, SteamEndpoint>

export { steamEndpoints as default }
