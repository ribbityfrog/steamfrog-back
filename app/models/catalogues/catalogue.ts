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
        db.raw(`count(*) filter (where maturity->>'isVanilla' = 'true')::integer as vanilla_count`),
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
      .select('id', 'name', 'is_free', 'pricing')
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

  static async finance(pojo: boolean = false) {
    const query = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .select(
        db.raw(
          `COUNT(*) FILTER (WHERE app_type = 'game' AND is_free::boolean = true)::integer AS games_free_count`
        ),
        db.raw(
          `COUNT(*) FILTER (WHERE app_type = 'dlc' AND is_free::boolean = true)::integer AS dlcs_free_count`
        ),
        db.raw(
          `SUM((pricing->>'priceFinal')::integer) FILTER (WHERE app_type = 'game' AND is_free::boolean = false)::integer AS games_price_final_sum`
        ),
        db.raw(
          `SUM((pricing->>'priceInitial')::integer) FILTER (WHERE app_type = 'game' AND is_free::boolean = false)::integer AS games_price_initial_sum`
        ),
        db.raw(
          `AVG((pricing->>'priceInitial')::integer) FILTER (WHERE app_type = 'game' AND is_free::boolean = false)::integer AS games_price_initial_avg`
        ),
        db.raw(
          `AVG((pricing->>'priceDiscount')::integer) FILTER (WHERE app_type = 'game' AND is_free::boolean = false AND (pricing->>'priceDiscount')::numeric > 0)::integer AS games_price_discount_avg`
        ),
        db.raw(
          `SUM((pricing->>'priceFinal')::integer) FILTER (WHERE app_type = 'dlc' AND is_free::boolean = false)::integer AS dlcs_price_final_sum`
        ),
        db.raw(
          `SUM((pricing->>'priceInitial')::integer) FILTER (WHERE app_type = 'dlc' AND is_free::boolean = false)::integer AS dlcs_price_initial_sum`
        ),
        db.raw(
          `AVG((pricing->>'priceInitial')::integer) FILTER (WHERE app_type = 'dlc' AND is_free::boolean = false)::integer AS dlcs_price_initial_avg`
        ),
        db.raw(
          `AVG((pricing->>'priceDiscount')::integer) FILTER (WHERE app_type = 'dlc' AND is_free::boolean = false AND (pricing->>'priceDiscount')::numeric > 0)::integer AS dlcs_price_discount_avg`
        )
      )

    if (pojo) query.pojo()

    const result = await query

    return result[0]
  }

  static async platforms(pojo: boolean = false) {
    const query = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .select(
        db.raw(`to_char((release->>'date')::timestamp, 'YYYY') as release_year`),
        db.raw(`count(*) filter (where app_type = 'game')::integer as games_count`),
        db.raw(`count(*) filter (where app_type = 'dlc')::integer as dlcs_count`),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'windows' = 'true')::integer as games_windows_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'windows' = 'true')::integer as dlcs_windows_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'mac' = 'true')::integer as games_mac_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'mac' = 'true')::integer as dlcs_mac_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'game' and platforms->>'linux' = 'true')::integer as games_linux_count`
        ),
        db.raw(
          `count(*) filter (where app_type = 'dlc' and platforms->>'linux' = 'true')::integer as dlcs_linux_count`
        )
      )
      .groupByRaw(`to_char((release->>'date')::timestamp, 'YYYY')`)
      .orderByRaw(`to_char((release->>'date')::timestamp, 'YYYY')`)

    if (pojo) query.pojo()

    return await query
  }

  static async schedule(pojo: boolean = false) {
    const queryAll = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .select(
        db.raw(`to_char((release->>'date')::timestamp, 'YYYY') as year`),
        db.raw(`to_char((release->>'date')::timestamp, 'MM') as month`),
        db.raw(`count(*) filter (where app_type = 'game')::integer as games_count`)
      )
      .groupByRaw(
        `to_char((release->>'date')::timestamp, 'YYYY'),
        to_char((release->>'date')::timestamp, 'MM')`
      )
      .orderByRaw(
        `to_char((release->>'date')::timestamp, 'YYYY') DESC,
        to_char((release->>'date')::timestamp, 'MM') ASC`
      )

    const queryTop = db
      .query()
      .from((sub) =>
        sub
          .from('catalogues.catalogues')
          .where('app_type', 'game')
          .andWhereRaw(`(release->>'isReleased')::boolean = true`)
          .andWhereRaw(`release->>'date' IS NOT NULL`)
          .join('catalogues.reviews', 'catalogues.id', 'reviews.catalogue_id')
          .orderBy('score_rounded', 'desc')
          .orderBy('score_percent', 'desc')
          .limit(5000)
          .select([
            'catalogues.id',
            'catalogues.app_type',
            db.raw(`release->>'date' as release_date`),
          ])
          .as('top_rated')
      )
      .select(
        db.raw(`to_char(release_date::timestamp, 'YYYY') as year`),
        db.raw(`to_char(release_date::timestamp, 'MM') as month`),
        db.raw(`count(*) filter (where app_type = 'game')::integer as games_count`)
      )
      .groupByRaw(
        `to_char(release_date::timestamp, 'YYYY'),
        to_char(release_date::timestamp, 'MM')`
      )
      .orderByRaw(
        `to_char(release_date::timestamp, 'YYYY') DESC,
        to_char(release_date::timestamp, 'MM') ASC`
      )

    if (pojo) {
      queryAll.pojo()
      queryTop.then((rows) => rows.map((r) => ({ ...r })))
    }

    const [all, top] = await Promise.all([queryAll, queryTop])

    return { all, top }
  }

  static async windowsless(pojo: true) {
    const query = Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .andWhereRaw(`platforms->>'windows' = 'false'`)
      .select('id', 'name', 'is_free', 'release', 'pricing')
      .orderByRaw(`release->>'date' DESC`)

    if (pojo) query.pojo()

    return await query
  }

  static async naming(keywords: string[], andor: boolean = false) {
    const queryCount = Catalogue.query()
      .select(
        db.raw(`TO_CHAR((release->>'date')::timestamp, 'YYYY') AS year`),
        db.raw(`COUNT(*)::integer AS count`)
      )
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .andWhere((sub) => {
        for (const kw of keywords)
          andor
            ? sub.orWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
            : sub.andWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
      })
      .groupByRaw(`TO_CHAR((release->>'date')::timestamp, 'YYYY')`)
      .orderByRaw(`TO_CHAR((release->>'date')::timestamp, 'YYYY')`)
      .pojo()

    const queryLast = Catalogue.query()
      .select('id', 'name', 'is_free', 'pricing', 'release')
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .andWhere((sub) => {
        for (const kw of keywords)
          andor
            ? sub.orWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
            : sub.andWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
      })
      .orderByRaw(`release->>'date' DESC`)
      .limit(32)

    const [count, last] = await Promise.all([queryCount, queryLast])

    return { count, last }
  }
}
