import { DateTime } from 'luxon'

export const categoryTypes = ['module', 'player', 'feature', 'controller', 'unknown'] as const
export type CategoryType = (typeof categoryTypes)[number]

export const appTypes = ['new', 'game', 'dlc', 'outer', 'broken', 'trash'] as const
export type AppType = (typeof appTypes)[number]

export const studioTypes = ['devel', 'publi'] as const
export type StudioType = (typeof studioTypes)[number]

// export type Reviews = {
//   score: number
//   scoreName: string
//   positiveCount: number
//   negativeCount: number
//   totalCount: number
// }

// export type Achievement = {
//   name: string
//   description: string
//   hidden: boolean
//   percent: number
// }

export type Release = {
  isReleased: boolean
  date: DateTime | null
  isEarlyAccess: boolean
  hasDemo: boolean
}

export type Rating = {
  type: string
  rating: string
  age: number
}

export type Maturity = {
  ageGate: number
  isMature: boolean
  isViolent: boolean
  isNudity: boolean
  isSexual: boolean
  isPorn: boolean
  isVanilla: boolean
}

export type Platforms = {
  windows: boolean
  mac: boolean
  linux: boolean
  deck: 0 | 1 | 2 | 3
}

export type Pricing = {
  priceInitial: number
  priceFinal: number
  priceDiscount: number
  isPrePurchase: boolean
}

export type Metacritic = {
  score: number
  url: string
}

export type Media = {
  screenshotCount: number
  videoCount: number
}
