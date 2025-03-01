import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

export default class Review extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'reviews'
  static table = 'catalogues.reviews'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare catalogueId: number

  @column()
  declare scoreRounded: number

  @column()
  declare scorePercent: number

  @column()
  declare countPositive: number

  @column()
  declare countNegative: number

  @column()
  declare countAll: number

  @belongsTo(() => Catalogue)
  declare app: BelongsTo<typeof Catalogue>
}
