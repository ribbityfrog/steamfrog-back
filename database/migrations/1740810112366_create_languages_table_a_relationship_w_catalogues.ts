import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected cataloguesSchema = 'catalogues'
  protected languagesTable = 'languages'
  protected cataloguesLanguagesTable = 'catalogues_languages'

  async up() {
    this.schema.withSchema(this.cataloguesSchema).createTable(this.languagesTable, (table) => {
      table.increments('id').primary()

      table.string('lang', 31).notNullable().unique()
      table.string('code', 7).unique().defaultTo(null)
    })

    this.schema
      .withSchema(this.cataloguesSchema)
      .createTable(this.cataloguesLanguagesTable, (table) => {
        table.increments('id').primary()

        table
          .integer('catalogue_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.catalogues`)
        table
          .integer('language_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable(`${this.cataloguesSchema}.${this.languagesTable}`)
        table.unique(['catalogue_id', 'language_id'])

        table.boolean('supported').notNullable().defaultTo(false)
        table.boolean('audio').notNullable().defaultTo(false)
        table.boolean('subtitles').notNullable().defaultTo(false)
      })
  }

  async down() {
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.cataloguesLanguagesTable)
    this.schema.withSchema(this.cataloguesSchema).dropTable(this.languagesTable)
  }
}
