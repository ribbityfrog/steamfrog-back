import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

import Catalogue from '#models/catalogues/catalogue'

export default class Tag extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'tags'
  static table = 'catalogues.tags'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_tags',
  })
  declare apps: ManyToMany<typeof Catalogue>
}
