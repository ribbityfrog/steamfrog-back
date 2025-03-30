import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected descriptorsTable = 'descriptors'
  protected cataloguesDescriptorsTable = 'catalogues_descriptors'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.descriptorsTable, (table) => {
      table.increments('id').primary()

      table.string('name', 127).unique()
    })

    this.schema
      .withSchema(this.cataloguesSchema)
      .createTable(this.cataloguesDescriptorsTable, (table) => {
        table.increments('id').primary()

        table
          .integer('catalogue_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.catalogues`)
          .onDelete('CASCADE')
        table
          .integer('descriptor_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.${this.descriptorsTable}`)
          .onDelete('CASCADE')
        table.unique(['catalogue_id', 'descriptor_id'])
      })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.cataloguesDescriptorsTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.descriptorsTable)
  }
}
