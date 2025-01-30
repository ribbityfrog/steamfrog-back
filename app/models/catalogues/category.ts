import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { CategoryType } from '#models/catalogues/types'

export default class Category extends BaseModel {
  static table = 'catalogues.categories'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

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
