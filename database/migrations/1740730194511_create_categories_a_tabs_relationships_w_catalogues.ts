import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected cataloguesCategoriesTable = 'catalogues_categories'
  protected cataloguesTagsTable = 'catalogues_tags'

  async up() {
    this.schema.withSchema(this.schemaName).createTable(this.cataloguesCategoriesTable, (table) => {
      table.increments('id').primary()

      table
        .integer('catalogue_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.catalogues`)
        .onDelete('CASCADE')
      table
        .integer('category_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.categories`)
        .onDelete('CASCADE')
      table.unique(['catalogue_id', 'category_id'])
    })

    this.schema.withSchema(this.schemaName).createTable(this.cataloguesTagsTable, (table) => {
      table.increments('id').primary()

      table
        .integer('catalogue_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.catalogues`)
      table
        .integer('tag_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.tags`)
      table.unique(['catalogue_id', 'tag_id'])
    })
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.cataloguesTagsTable)
    this.schema.withSchema(this.schemaName).dropTable(this.cataloguesCategoriesTable)
  }
}
