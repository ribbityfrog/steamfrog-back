import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Catalogue from '#models/catalogues/catalogue'

export default class Vr extends BaseModel {
  static schemaName = 'catalogues'
  static tableName = 'vrs'
  static table = 'catalogues.vrs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @manyToMany(() => Catalogue, {
    pivotTable: 'catalogues.catalogues_vrs',
  })
  declare apps: ManyToMany<typeof Catalogue>
}
