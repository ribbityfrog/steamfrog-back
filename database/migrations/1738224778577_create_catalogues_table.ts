import { BaseSchema } from '@adonisjs/lucid/schema'

import { appTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected tableName = 'catalogues'

  protected appTypesAllowed = appTypes.map((appType) => `'${appType}'`).join(', ')

  async up() {
    this.schema.withSchema(this.schemaName).createTable(this.tableName, (table) => {
      table.integer('id').primary()

      table.string('app_type').notNullable().defaultTo('new')

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

      table.integer('age_gate').notNullable().defaultTo(0)
      table.jsonb('rating')

      table.jsonb('platforms')

      table.specificType('developers', 'varchar(255)[]').notNullable().defaultTo('{}')
      table.specificType('publishers', 'varchar(255)[]').notNullable().defaultTo('{}')
      table.specificType('franchises', 'varchar(255)[]')

      // table.specificType('categories', 'integer[]').notNullable().defaultTo('{}')
      // table.specificType('tags', 'integer[]').notNullable().defaultTo('{}')

      table.boolean('is_free')
      table.jsonb('pricing')

      table.specificType('languages', 'jsonb[]').notNullable().defaultTo('{}')
      // table.jsonb('languages').notNullable().defaultTo('[]')
      table.jsonb('media')

      table.jsonb('metacritic')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
    this.schema.raw(
      `ALTER TABLE ${this.schemaName}.${this.tableName} ADD CONSTRAINT app_type_allowed CHECK (app_type IN (${this.appTypesAllowed}))`
    )
    this.schema.raw(
      `ALTER TABLE ${this.schemaName}.${this.tableName} ADD CONSTRAINT age_gate_limit CHECK (age_gate >= 0)`
    )
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
  }
}
