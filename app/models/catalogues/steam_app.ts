import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { AppType } from '#models/catalogues/types'

export default class SteamApp extends BaseModel {
  static table = 'catalogues.steam_apps'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare appType: AppType

  @column()
  declare name: string

  @column()
  declare storeUpdatedAt: DateTime

  @column()
  declare storeLastlyUpdatedAt: DateTime

  @column()
  declare storePreviouslyUpdatedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
