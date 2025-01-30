import { BaseSchema } from '@adonisjs/lucid/schema'

import { categoryTypes } from '#models/catalogues/types'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected categoriesTable = 'categories'
  protected tagsTable = 'tags'

  protected categoryTypesAllowed = categoryTypes
    .map((categoryType) => `'${categoryType}'`)
    .join(', ')

  async up() {
    this.schema.createSchema(this.cataloguesSchema)

    this.schema.withSchema(this.cataloguesSchema).createTable(this.categoriesTable, (table) => {
      table.integer('id').primary()

      table.string('type').notNullable()
      table.string('name').notNullable()
      table.string('logo').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
    this.schema.raw(
      `ALTER TABLE ${this.cataloguesSchema}.${this.categoriesTable} ADD CONSTRAINT type_allowed CHECK (type IN (${this.categoryTypesAllowed}))`
    )

    this.schema.withSchema(this.cataloguesSchema).createTable(this.tagsTable, (table) => {
      table.integer('id').primary()

      table.string('name').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.tagsTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.categoriesTable)
    this.schema.dropSchema(this.cataloguesSchema)
  }
}
