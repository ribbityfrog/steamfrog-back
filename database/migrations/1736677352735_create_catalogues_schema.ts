import { BaseSchema } from '@adonisjs/lucid/schema'

import { appTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected tableName = 'steam_apps'
  protected appTypesAllowed = appTypes.map((appType) => `'${appType}'`).join(', ')

  async up() {
    this.schema.createSchema(this.schemaName)

    this.schema.withSchema(this.schemaName).createTable(this.tableName, (table) => {
      table.integer('id').primary()

      table.string('app_type').notNullable().defaultTo('new')

      table.integer('parent_game_id')
      table.string('name', 511).notNullable()

      table.timestamp('store_updated_at').notNullable()
      table.timestamp('store_lastly_updated_at')
      table.timestamp('store_previously_updated_at')

      table.boolean('is_enriched').notNullable().defaultTo(false)

      table.jsonb('reviews')
      table.specificType('achievements', 'jsonb[]')

      table.boolean('is_released')
      table.timestamp('release_date')

      table.integer('age')

      table.jsonb('platforms')
      table.boolean('has_controller_support')

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
    this.schema.raw(
      `ALTER TABLE ${this.schemaName}.${this.tableName} ADD CONSTRAINT app_type_allowed CHECK (app_type IN (${this.appTypesAllowed}))`
    )
    this.schema.raw(
      `ALTER TABLE ${this.schemaName}.${this.tableName} ADD CONSTRAINT age_limit CHECK (age >= 0)`
    )
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
    this.schema.dropSchema(this.schemaName)
  }
}
