import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { WaveStep } from '#models/treatments/types'
import { compose } from '@adonisjs/core/helpers'
import withDefaultFields from '#models/mixins/default_fields'

export default class Wave extends compose(BaseModel, withDefaultFields) {
  static table = 'treatments.waves'

  @column()
  declare wave: number

  @column()
  declare step: WaveStep

  @column()
  declare lastAppid: number
}
