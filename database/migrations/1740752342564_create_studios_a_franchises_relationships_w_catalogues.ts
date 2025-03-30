import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected cataloguesStudiosTable = 'catalogues_studios'
  protected cataloguesFranchisesTable = 'catalogues_franchises'

  async up() {
    this.schema
      .withSchema(this.cataloguesSchema)
      .createTable(this.cataloguesStudiosTable, (table) => {
        table.increments('id')

        table
          .integer('catalogue_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.catalogues`)
          .onDelete('CASCADE')
        table
          .integer('studio_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.studios`)
          .onDelete('CASCADE')
        table.unique(['catalogue_id', 'studio_id'])
      })

    this.schema
      .withSchema(this.cataloguesSchema)
      .createTable(this.cataloguesFranchisesTable, (table) => {
        table.increments('id').primary()

        table
          .integer('catalogue_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.catalogues`)
        table
          .integer('franchise_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.franchises`)
        table.unique(['catalogue_id', 'franchise_id'])
      })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.cataloguesFranchisesTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.cataloguesStudiosTable)
  }
}
