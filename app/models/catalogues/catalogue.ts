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

  serializeExtras = true

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

  static treatable = scope((query) =>
    query
      .where((sub) => sub.where('app_type', 'game').orWhere('app_type', 'dlc'))
      .andWhereRaw(`release->>'isReleased' = 'true'`)
      .andWhereRaw(`release->>'date' IS NOT NULL`)
      .andWhere((sub) =>
        sub.where('is_free', true).orWhereRaw(`pricing->>'priceFinal' IS NOT NULL`)
      )
  )

  static async appsCount(pojo: boolean = false) {
    const query = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .select(
        db.raw(`count(*) filter (where app_type = 'game')::integer as games_count`),
        db.raw(`count(*) filter (where app_type = 'dlc')::integer as dlcs_count`)
      )

    if (pojo) query.pojo()

    const result = await query

    return result[0]
  }

  static async maturityCount(pojo: boolean = false) {
    const query = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .select(
        db.raw(`count(*) filter (where maturity->>'isMature' = 'true')::integer as mature_count`),
        db.raw(`count(*) filter (where maturity->>'isViolent' = 'true')::integer as violent_count`),
        db.raw(`count(*) filter (where maturity->>'isNudity' = 'true')::integer as nudity_count`),
        db.raw(`count(*) filter (where maturity->>'isSexual' = 'true')::integer as sexual_count`),
        db.raw(`count(*) filter (where maturity->>'isPorn' = 'true')::integer as porn_count`)
      )

    if (pojo) query.pojo()

    const result = await query

    return result[0]
  }

  static async brokens(pojo: boolean = false) {
    const query = Catalogue.query()
      .select('id', 'name', 'is_free', db.raw(`pricing->>'priceFinal' as price`))
      .where((sub) => sub.where('app_type', 'game'))
      .andWhere('is_items_enriched', true)
      .andWhere((sub) =>
        sub
          .where((subsub) =>
            subsub
              .whereRaw(`release->>'isReleased' = 'true'`)
              .andWhereRaw(`release->>'date' IS NULL`)
          )
          .orWhere((subsub) =>
            subsub
              .where('is_free', false)
              .andWhereRaw(`pricing->>'priceFinal' IS NULL`)
              .andWhereRaw(`release->>'isReleased' = 'true'`)
          )
      )

    if (pojo) query.pojo()

    return await query
  }
}
