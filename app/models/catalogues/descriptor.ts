import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

import Catalogue from '#models/catalogues/catalogue'

export default class Descriptor extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'descriptors'
  static table = 'catalogues.descriptors'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_descriptors',
  })
  declare apps: ManyToMany<typeof Catalogue>
}
