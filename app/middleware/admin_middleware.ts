import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Except from '#utils/except'
import { superAdmin } from '#abilities/main'

export default class BounceMiddleware {
  async handle({ auth, bouncer }: HttpContext, next: NextFn) {
    if (!auth?.user || (await bouncer.denies(superAdmin))) Except.forbidden()
    const output = await next()
    return output
  }
}
