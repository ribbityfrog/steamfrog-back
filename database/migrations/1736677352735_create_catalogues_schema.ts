import { BaseSchema } from '@adonisjs/lucid/schema'

import { appTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected tableName = 'steam_apps'

  async up() {
    this.schema.createSchema(this.schemaName)

    this.schema.withSchema(this.schemaName).createTable(this.tableName, (table) => {
      table.integer('id').primary()

      table.enum('app_type', appTypes).notNullable().defaultTo('new')
      table.string('name').notNullable()

      table.timestamp('store_updated_at').notNullable()
      table.timestamp('store_lastly_updated_at')
      table.timestamp('store_previously_updated_at')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
    this.schema.dropSchema(this.schemaName)
  }
}
