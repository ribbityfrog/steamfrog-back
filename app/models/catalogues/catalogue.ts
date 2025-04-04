import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, hasMany, manyToMany, scope } from '@adonisjs/lucid/orm'
import type { HasOne, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import type {
  AppType,
  Maturity,
  Media,
  // Metacritic,
  Platforms,
  Pricing,
  Rating,
  Release,
} from '#models/catalogues/types'

import db from '@adonisjs/lucid/services/db'
import Category from '#models/catalogues/category'
import Tag from '#models/catalogues/tag'
import Studio from '#models/catalogues/studio'
import Franchise from '#models/catalogues/franchise'
import Descriptor from '#models/catalogues/descriptor'
import Language from '#models/catalogues/language'
import Review from '#models/catalogues/review'
import Achievement from '#models/catalogues/achievement'
import Vr from '#models/catalogues/vr'

export default class Catalogue extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'catalogues'
  static table = 'catalogues.catalogues'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare group: number

  @column()
  declare appType: AppType

  @column()
  declare parentId: number | null

  @column()
  declare name: string

  @column.dateTime()
  declare storeUpdatedAt: DateTime

  @column.dateTime()
  declare storeLastlyUpdatedAt: DateTime

  @column.dateTime()
  declare storePreviouslyUpdatedAt: DateTime

  @column()
  declare isItemsEnriched: boolean

  @column()
  declare isDetailsEnriched: boolean

  @column()
  declare areAchievementsEnriched: boolean

  @column()
  declare release: Release

  @column()
  declare maturity: Maturity

  @column()
  declare rating: Rating | null

  @column()
  declare platforms: Platforms

  @column()
  declare isFree: boolean

  @column()
  declare pricing: Pricing | null

  // @column()
  // declare metacritic: Metacritic | null

  @column()
  declare media: Media

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Category, {
    pivotTable: `${Catalogue.schemaName}.${Catalogue.tableName}_${Category.tableName}`,
  })
  declare categories: ManyToMany<typeof Category>

  @manyToMany(() => Tag, {
    pivotTable: 'catalogues.catalogues_tags',
  })
  declare tags: ManyToMany<typeof Tag>

  @manyToMany(() => Studio, {
    pivotTable: 'catalogues.catalogues_studios',
  })
  declare studios: ManyToMany<typeof Studio>

  @manyToMany(() => Franchise, {
    pivotTable: 'catalogues.catalogues_franchises',
  })
  declare franchises: ManyToMany<typeof Franchise>

  @manyToMany(() => Descriptor, {
    pivotTable: 'catalogues.catalogues_descriptors',
  })
  declare descriptors: ManyToMany<typeof Descriptor>

  @manyToMany(() => Language, {
    pivotTable: 'catalogues.catalogues_languages',
  })
  declare languages: ManyToMany<typeof Language>

  @hasOne(() => Review)
  declare review: HasOne<typeof Review>

  @hasMany(() => Achievement)
  declare achievements: HasMany<typeof Achievement>

  @manyToMany(() => Vr, {
    pivotTable: 'catalogues.catalogues_vrs',
  })
  declare vrs: ManyToMany<typeof Vr>

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
      Catalogue.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('pricing')
        .orderByRaw("(pricing->>'priceFinal')::numeric DESC")
        .limit(3),
      Catalogue.query()
        .withScopes((scopes) => scopes.enrichedDlc())
        .andWhereNotNull('pricing')
        .orderByRaw("(pricing->>'priceFinal')::numeric DESC")
        .limit(3),
      Catalogue.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'positiveCount')::integer DESC")
        .limit(3),
      Catalogue.query()
        .withScopes((scopes) => scopes.enrichedDlc())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'positiveCount')::integer DESC")
        .limit(3),
      Catalogue.query()
        .withScopes((scopes) => scopes.enrichedGame())
        .andWhereNotNull('reviews')
        .orderByRaw("(reviews->>'negativeCount')::integer DESC")
        .limit(3),
      Catalogue.query()
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
    const [totals] = await db.from(Catalogue.table).select(
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
      .from(Catalogue.table)
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
    const games = await Catalogue.query()
      .where('is_enriched', true)
      .andWhere('app_type', 'game')
      .andWhereRaw("(platforms->>'windows')::boolean IS false")

    return { count: games.length, games }
  }
}
