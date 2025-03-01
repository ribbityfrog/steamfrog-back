import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

import type { CategoryType } from '#models/catalogues/types'

import Catalogue from '#models/catalogues/catalogue'

export default class Category extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'categories'
  static table = `catalogues.categories`

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: CategoryType

  @column()
  declare name: string

  @column()
  declare order: number

  @column()
  declare logo: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_categories',
  })
  declare apps: ManyToMany<typeof Catalogue>

  static typeCodeToString(typeCodde: number): CategoryType {
    switch (typeCodde) {
      case 0:
        return 'module'
      case 1:
        return 'player'
      case 2:
        return 'feature'
      case 3:
        return 'controller'
      default:
        return 'unknown'
    }
  }
}
