import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected reviewsTable = 'reviews'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.reviewsTable, (table) => {
      table.increments('id').primary()

      table
        .integer('catalogue_id')
        .unique()
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.cataloguesSchema}.catalogues`)
        .onDelete('CASCADE')

      table.integer('score_rounded').notNullable().defaultTo(-1)
      table.integer('score_percent').notNullable().defaultTo(-1)
      table.integer('count_positive').notNullable().defaultTo(-1)
      table.integer('count_negative').notNullable().defaultTo(-1)
      table.integer('count_all').notNullable().defaultTo(-1)
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.reviewsTable)
  }
}
