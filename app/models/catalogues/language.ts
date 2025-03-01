import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

export default class Language extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'languages'
  static table = 'catalogues.languages'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lang: string
  @column()
  declare code: string | null

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_languages',
    pivotColumns: ['supported', 'audio', 'subtitles'],
  })
  declare apps: ManyToMany<typeof Catalogue>
}
