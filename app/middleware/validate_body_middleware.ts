import Except from '#utils/except'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { ZodType } from 'zod'

export default class ValidateBodyMiddleware {
  async handle({ request }: HttpContext, next: NextFn, options: ZodType) {
    if (request.hasBody() === false) Except.unprocessableEntity()

    const against = request.body()

    if (against === undefined) Except.unprocessableEntity()

    const parseResult = options.safeParse(against)

    if (parseResult.success === false) Except.unprocessableEntity({ debug: parseResult })

    await next()
  }
}
