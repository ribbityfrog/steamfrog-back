import { BaseSchema } from '@adonisjs/lucid/schema'

import { waveSteps } from '#models/treatments/types'
import { defaultFieldsMigration } from '#models/mixins/default_fields'

export default class extends BaseSchema {
  protected schemaName = 'treatments'
  protected tableName = 'waves'
  protected waveStepsAllowed = waveSteps.map((waveStep) => `'${waveStep}'`).join(', ')

  async up() {
    this.schema.createSchema(this.schemaName)

    this.schema.withSchema(this.schemaName).createTable(this.tableName, (table) => {
      defaultFieldsMigration(this, table)

      table.increments('wave', { primaryKey: false }).notNullable()

      table.string('step').notNullable().defaultTo('list')
      table.integer('last_appid').notNullable().defaultTo(0)
    })
    this.schema.raw(
      `ALTER TABLE ${this.schemaName}.${this.tableName} ADD CONSTRAINT step_allowed CHECK (step IN (${this.waveStepsAllowed}))`
    )
  }

  async down() {
    this.schema.withSchema(this.schemaName).dropTable(this.tableName)
    this.schema.dropSchema(this.schemaName)
  }
}
