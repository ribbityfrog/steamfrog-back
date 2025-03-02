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

      table.integer('score_rounded').notNullable()
      table.integer('score_percent').notNullable()
      table.integer('count_positive').notNullable()
      table.integer('count_negative').notNullable()
      table.integer('count_all').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.reviewsTable)
  }
}
