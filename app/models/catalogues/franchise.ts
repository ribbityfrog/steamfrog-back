import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

export default class Franchise extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'franchises'
  static table = 'catalogues.franchises'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_franchises',
  })
  declare apps: ManyToMany<typeof Catalogue>
}
