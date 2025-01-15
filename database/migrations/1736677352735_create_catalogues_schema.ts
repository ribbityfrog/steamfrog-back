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
      table.integer('parent_game_id')
      table.string('name', 511).notNullable()

      table.timestamp('store_updated_at').notNullable()
      table.timestamp('store_lastly_updated_at')
      table.timestamp('store_previously_updated_at')

      table.boolean('is_enriched').notNullable().defaultTo(false)

      table.jsonb('reviews')
      table.specificType('achievements', 'jsonb[]')

      table.boolean('is_released')
      table.string('release_date')

      table.string('age', 63)

      table.jsonb('platforms')
      table.string('controller', 63)

      table.specificType('developers', 'varchar(255)[]').notNullable().defaultTo('{}')
      table.specificType('publishers', 'varchar(255)[]').notNullable().defaultTo('{}')
      table.specificType('genres', 'varchar(255)[]').notNullable().defaultTo('{}')
      table.specificType('categories', 'varchar(255)[]').notNullable().defaultTo('{}')

      table.boolean('is_free')
      table.jsonb('pricing')

      table.jsonb('metacritic')
      table.jsonb('media')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
    this.schema.dropSchema(this.schemaName)
  }
}
