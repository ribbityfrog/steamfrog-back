import { DateTime } from 'luxon'

export const categoryTypes = ['module', 'player', 'feature', 'controller', 'unknown'] as const
export type CategoryType = (typeof categoryTypes)[number]

export const appTypes = ['new', 'game', 'dlc', 'outer', 'broken', 'trash'] as const
export type AppType = (typeof appTypes)[number]

export type Reviews = {
  score: number
  scoreName: string
  positiveCount: number
  negativeCount: number
  totalCount: number
}

export type Achievement = {
  name: string
  description: string
  hidden: boolean
  percent: number
}

export type Release = {
  isReleased: boolean
  date: DateTime | null
  hasEarlyAccess: boolean
  hasDemo: boolean
}

export type Rating = {
  type: string
  rating: string
}

// export type Platforms = {
//   windows: boolean
//   mac: boolean
//   linux: boolean
// }

export type Language = {
  elanguage: number
  language: string
  supported: boolean
  audio: boolean
  subtitles: boolean
}

export type Pricing = {
  priceInitial: number
  priceFinal: number
  priceDiscount: number
  hasPrePurchase: boolean
}

export type Metacritic = {
  score: number
  url: string
}

export type Media = {
  screenshotCount: number
  videoCount: number
}
