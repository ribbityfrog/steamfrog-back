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
  categories: {
    route: 'https://api.steampowered.com/IStoreBrowseService/GetStoreCategories/v1/',
    params: {
      elanguage: 0,
    },
    key: true,
  },
  tags: {
    route: 'https://api.steampowered.com/IStoreService/GetTagList/v1/',
    params: {
      language: 'english',
    },
    key: true,
  },
  app: {
    route: 'https://store.steampowered.com/api/appdetails/',
    params: { cc: 'us' },
    key: false,
  },
  item: {
    route: 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/',
    params: {
      context: {
        country_code: 'us',
      },
      data_request: {
        include_tag_count: true,
        include_basic_info: true,
        inluce_release: true,
        include_platforms: true,
        include_ratings: true,
        include_screenshots: true,
        include_trailets: true,
        include_supported_languages: true,
      },
    },
    key: true,
    stringify: true,
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
