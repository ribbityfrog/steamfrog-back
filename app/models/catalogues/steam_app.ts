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
import db from '@adonisjs/lucid/services/db'

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

  @column.dateTime()
  declare storeUpdatedAt: DateTime

  @column.dateTime()
  declare storeLastlyUpdatedAt: DateTime

  @column.dateTime()
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

  static async statsNotOnWindows() {}

  static async statsPlatforms() {
    const [platforms] = await db
      .from(SteamApp.table)
      .where('is_enriched', true)
      .andWhere((query) => {
        query.where('app_type', 'game').orWhere('app_type', 'dlc')
      })
      .select(
        db.raw(`
            jsonb_build_object(
              'game', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
              ),
              'dlc', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'windows')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
              )
            ) AS windows,
            jsonb_build_object(
              'game', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
                ),
              'dlc', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'mac')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
              )
            ) AS mac,
            jsonb_build_object(
              'game', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'game' THEN (pricing->>'priceFinal')::numeric END) / 100
              ),
              'dlc', jsonb_build_object(
                'count', COUNT(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN 1 END),
                'priceInitial', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceInitial')::numeric END) / 100,
                'priceFinal', SUM(CASE WHEN (platforms->>'linux')::boolean IS true AND app_type = 'dlc' THEN (pricing->>'priceFinal')::numeric END) / 100
              )
            ) AS linux
        `)
      )

    return platforms
  }
}
