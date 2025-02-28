import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

import type { StudioType } from '#models/catalogues/types'

export default class Studio extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'studios'
  static table = 'catalogues.studios'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: StudioType

  @column()
  declare name: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_studios',
  })
  declare apps: ManyToMany<typeof Catalogue>
}
