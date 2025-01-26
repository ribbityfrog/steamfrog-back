import { DateTime } from 'luxon'
import { BaseModel, column, scope } from '@adonisjs/lucid/orm'
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

  @column.dateTime()
  declare releaseDate: DateTime | null

  @column()
  declare age: number

  @column()
  declare platforms: Platforms

  @column()
  declare hasControllerSupport: boolean

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

  static enrichedGame = scope((query) =>
    query.where('is_enriched', true).andWhere('app_type', 'game')
  )
  static enrichedDlc = scope((query) =>
    query.where('is_enriched', true).andWhere('app_type', 'dlc')
  )
  static enrichedGameOrDlc = scope((query) =>
    query.where('is_enriched', true).andWhereIn('app_type', ['game', 'dlc'])
  )

  static async statsStudios() {}

  static async statsGames() {
    const [
      mostExpensiveGame,
      mostExpensiveDlc,
      mostPositiveGame,
      mostPositiveDlc,
      mostNegativeGame,
      mostNegativeDlc,
    ] = await Promise.all([
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('pricing')
        .orderByRaw("(pricing->>'priceFinal')::numeric DESC")
        .limit(3),
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedDlc())
        .andWhereNotNull('pricing')
        .orderByRaw("(pricing->>'priceFinal')::numeric DESC")
        .limit(3),
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'positiveCount')::integer DESC")
        .limit(3),
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedDlc())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'positiveCount')::integer DESC")
        .limit(3),
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'negativeCount')::integer DESC")
        .limit(3),
      SteamApp.query()
        .withScopes((scopes) => scopes.enrichedDlc())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'negativeCount')::integer DESC")
        .limit(3),
    ])

    return {
      mostExpensiveGame,
      mostExpensiveDlc,
      mostPositiveGame,
      mostPositiveDlc,
      mostNegativeGame,
      mostNegativeDlc,
    }
  }

  static async statsTotals() {
    const [totals] = await db.from(SteamApp.table).select(
      db.raw(`
        (COUNT(CASE WHEN app_type = 'game' THEN 1 END))::integer AS game_count,
        (COUNT(CASE WHEN app_type = 'dlc' THEN 1 END))::integer AS dlc_count,
        (COUNT(CASE WHEN app_type = 'outer' THEN 1 END))::integer AS outer_count,
        (SUM((pricing->>'priceInitial')::numeric) / 100)::integer AS price_initial_sum,
        (SUM((pricing->>'priceFinal')::numeric) / 100)::integer AS price_final_sum
        `)
    )

    return totals
  }

  static async statsPlatforms() {
    const [platforms] = await db
      .from(SteamApp.table)
      // .withScopes((scopes) => scopes.enrichedGameOrDlc())
      .where('is_enriched', true)
      .andWhereIn('app_type', ['game', 'dlc'])
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

  static async notOnWindows() {
    const games = await SteamApp.query()
      .where('is_enriched', true)
      .andWhere('app_type', 'game')
      .andWhereRaw("(platforms->>'windows')::boolean IS false")

    return { count: games.length, games }
  }
}
