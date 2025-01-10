import Except from '#utils/except'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { ZodType } from 'zod'

export default class ValidateBodyMiddleware {
  async handle({ params }: HttpContext, next: NextFn, options: ZodType) {
    const against = params

    if (against === undefined) Except.unprocessableEntity()

    const parseResult = options.safeParse(against)

    if (parseResult.success === false) Except.unprocessableEntity({ debug: parseResult })

    await next()
  }
}
