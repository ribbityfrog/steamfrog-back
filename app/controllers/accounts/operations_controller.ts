import type { HttpContext } from '@adonisjs/core/http'
import Operation from '#models/accounts/operation'
import User from '#models/accounts/user'
import Except from '#utils/except'
import magicLink from '#utils/magic_link'

import mailer from '#services/mailer'

export default class OperationsController {
  async login({ request }: HttpContext) {
    const body = request.body()

    const user = await User.getWithOperations(body.email)
    if (user === null) return

    const operationKeys = await Operation.createForUser(user, 'connect')
    if (operationKeys === null)
      return Except.internalServerError('http', { debug: 'Failed to create connect operation' })

    await mailer.sendConnect(user.email, {
      MLINK: magicLink('connect', operationKeys),
    })
  }

  async newEmail({ auth, request }: HttpContext) {
    if (!auth?.user) return Except.forbidden()

    const operationKeys = await Operation.createForUser(auth.user, 'newEmail', request.body())
    if (operationKeys === null)
      return Except.internalServerError('http', { debug: 'Failed to create new email operation' })

    await mailer.sendNewEmail(auth.user.email, {
      MLINK: magicLink('newEmail', operationKeys),
    })
  }
}
