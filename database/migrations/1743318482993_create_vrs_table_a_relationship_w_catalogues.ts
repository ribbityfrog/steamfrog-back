import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected vrsTable = 'vrs'
  protected cataloguesVrsTable = 'catalogues_vrs'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.vrsTable, (table) => {
      table.increments('id').primary()

      table.string('code', 15).notNullable().unique()
      table.string('name', 31).notNullable().defaultTo('VR Device')
    })

    this.schema.withSchema(this.cataloguesSchema).createTable(this.cataloguesVrsTable, (table) => {
      table.increments('id')

      table
        .integer('catalogue_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.cataloguesSchema}.catalogues`)
        .onDelete('CASCADE')
      table
        .integer('vr_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.cataloguesSchema}.${this.vrsTable}`)
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.cataloguesVrsTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.vrsTable)
  }
}
