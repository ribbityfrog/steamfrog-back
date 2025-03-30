import { BaseSchema } from '@adonisjs/lucid/schema'

import { categoryTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected categoriesTable = 'categories'
  protected tagsTable = 'tags'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.categoriesTable, (table) => {
      table.integer('id').primary()

      table
        .string('type')
        .notNullable()
        .checkIn([...categoryTypes], 'category_types_allowed')
      table.string('name').notNullable()
      table.integer('order').notNullable().defaultTo(99999)
      table.string('logo').notNullable()
    })

    this.schema.withSchema(this.cataloguesSchema).createTable(this.tagsTable, (table) => {
      table.integer('id').primary()

      table.string('name').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.tagsTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.categoriesTable)
  }
}
