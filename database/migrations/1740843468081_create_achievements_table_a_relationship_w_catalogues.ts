import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected achievementsTable = 'achievements'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.achievementsTable, (table) => {
      table.bigIncrements('id').primary()

      table
        .integer('catalogue_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(`${this.cataloguesSchema}.catalogues`)
        .onDelete('CASCADE')

      table.string('name').notNullable()
      table.string('description').defaultTo(null)
      table.boolean('hidden').notNullable()
      table.integer('percent').notNullable()
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.achievementsTable)
  }
}
