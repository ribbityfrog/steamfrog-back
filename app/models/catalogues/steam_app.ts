import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type {
  Achievement,
  AppType,
  Media,
  Metacritic,
  Platforms,
  Pricing,
  Reviews,
} from '#models/catalogues/types'

export default class SteamApp extends BaseModel {
  static table = 'catalogues.steam_apps'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare appType: AppType

  @column()
  declare parentGameId: number | null

  @column()
  declare name: string

  @column()
  declare storeUpdatedAt: DateTime

  @column()
  declare storeLastlyUpdatedAt: DateTime

  @column()
  declare storePreviouslyUpdatedAt: DateTime

  @column()
  declare isEnriched: boolean

  @column()
  declare reviews: Reviews

  @column()
  declare achievements: Achievement[] | null

  @column()
  declare isReleased: boolean

  @column()
  declare releaseDate: string | null

  @column()
  declare age: string

  @column()
  declare platforms: Platforms

  @column()
  declare controller: string | null

  @column()
  declare developers: string[]

  @column()
  declare publishers: string[]

  @column()
  declare categories: string[]

  @column()
  declare genres: string[] | null

  @column()
  declare isFree: boolean | null

  @column()
  declare pricing: Pricing

  @column()
  declare metacritic: Metacritic | null

  @column()
  declare media: Media

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
