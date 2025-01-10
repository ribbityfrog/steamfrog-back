import type { Knex } from 'knex'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { BaseSchema } from '@adonisjs/lucid/schema'
import { DateTime } from 'luxon'
import type { UUID } from 'node:crypto'
import { NormalizeConstructor } from '@adonisjs/core/types/helpers'

const withDefaultFields = <Model extends NormalizeConstructor<typeof BaseModel>>(
  superclass: Model
) => {
  class Default extends superclass {
    @column({ isPrimary: true })
    declare id: UUID

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
  }
  return Default
}

export default withDefaultFields

export function defaultFieldsMigration(that: BaseSchema, table: Knex.CreateTableBuilder) {
  table.uuid('id').primary().defaultTo(that.raw('gen_random_uuid()'))
  table.timestamp('created_at').notNullable()
  table.timestamp('updated_at').notNullable()
}
