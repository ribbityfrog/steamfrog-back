import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import Except from '#utils/except'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      silent?: boolean
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth
      .authenticateUsing(options.guards, { loginRoute: this.redirectTo })
      .catch((error) => {
        if (options?.silent !== true) Except.unauthorized({ debug: error })
      })
    return next()
  }
}
