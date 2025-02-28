import { studioTypes } from '#models/catalogues/types'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected studiosTableName = 'studios'
  protected franchisesTableName = 'franchises'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.studiosTableName, (table) => {
      table.increments('id').primary()

      table
        .string('type', 7)
        .notNullable()
        .checkIn([...studioTypes])
      table.string('name', 255).notNullable()
      table.unique(['type', 'name'])
    })

    this.schema.withSchema(this.cataloguesSchema).createTable(this.franchisesTableName, (table) => {
      table.increments('id')

      table.string('name', 255).notNullable().unique()
    })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.studiosTableName)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.franchisesTableName)
  }
}
