export const categoryTypes = ['module', 'player', 'feature', 'controller'] as const
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

export type Platforms = {
  windows: boolean
  mac: boolean
  linux: boolean
}

export type Pricing = {
  priceInitial: number
  priceFinal: number
  priceDiscount: number
}

export type Metacritic = {
  score: number
  url: string
}

export type Media = {
  header: string
  screenshotCount: number
  videoCount: number
}
