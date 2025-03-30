import { BaseSchema } from '@adonisjs/lucid/schema'

import { appTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected tableName = 'catalogues'

  async up() {
    this.schema.createSchema(this.schemaName)

    this.schema.withSchema(this.schemaName).createTable(this.tableName, (table) => {
      table.integer('id').primary()
      table.integer('group').notNullable()

      table
        .string('app_type')
        .notNullable()
        .defaultTo('new')
        .checkIn([...appTypes], 'app_types_allowed')

      table.integer('parent_id')
      table.string('name', 511).notNullable()

      table.timestamp('store_updated_at').notNullable()
      table.timestamp('store_lastly_updated_at')
      table.timestamp('store_previously_updated_at')

      table.boolean('is_items_enriched').notNullable().defaultTo(false)
      table.boolean('is_details_enriched').notNullable().defaultTo(false)

      table.jsonb('reviews')
      table.specificType('achievements', 'jsonb[]')

      table.jsonb('release')

      table.jsonb('maturity')
      table.jsonb('rating')

      table.jsonb('platforms')

      table.boolean('is_free')
      table.jsonb('pricing')

      table.jsonb('media')

      // table.jsonb('metacritic')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
    this.schema.dropSchema(this.schemaName)
  }
}
