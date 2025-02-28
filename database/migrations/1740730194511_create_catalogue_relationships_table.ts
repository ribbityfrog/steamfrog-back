import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected schemaName = 'catalogues'
  protected catalogueCategoryTable = 'catalogues_categories'
  protected catalogueTagTable = 'catalogues_tags'

  async up() {
    this.schema.withSchema(this.schemaName).createTable(this.catalogueCategoryTable, (table) => {
      table.increments('id').primary()

      table
        .integer('catalogue_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.catalogues`)
      table
        .integer('category_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.schemaName}.categories`)
      table.unique(['catalogue_id', 'category_id'])
    })

    this.schema.withSchema(this.schemaName).createTable(this.catalogueTagTable, (table) => {
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
    this.schema.withSchema(this.schemaName).dropTable(this.catalogueTagTable)
    this.schema.withSchema(this.schemaName).dropTable(this.catalogueCategoryTable)
  }
}
