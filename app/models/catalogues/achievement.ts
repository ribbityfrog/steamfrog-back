import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

export default class Achievement extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'achievements'
  static table = 'catalogues.achievements'

  @column({ isPrimary: true })
  declare id: bigint

  @column()
  declare catalogueId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare hidden: boolean

  @column()
  declare percent: number

  @belongsTo(() => Catalogue)
  declare game: BelongsTo<typeof Catalogue>
}
