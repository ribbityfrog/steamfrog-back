import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/accounts/user'
import Operation from '#models/accounts/operation'
import magicLink from '#utils/magic_link'
import Except from '#utils/except'

import mailer from '#services/mailer'
import { OperationKeys } from '#schemas/accounts/operation'

export default class UsersController {
  async create({ request }: HttpContext) {
    const body = request.body()

    const checkUser = await User.findBy('email', body.email)
    const user = checkUser !== null ? checkUser : await User.create({ email: body.email })

    const operationKeys = await Operation.createForUser(user, 'connect')
    if (operationKeys === null) return Except.internalServerError()

    if (checkUser !== null)
      await mailer.sendConnect(user.email, {
        MLINK: magicLink('connect', operationKeys),
      })
    else
      await mailer.sendCreateAccount(user.email, {
        MLINK: magicLink('connect', operationKeys),
      })
  }

  async newEmail({ request }: HttpContext) {
    const operationKeys = request.body() as OperationKeys

    const operation = await Operation.useOrFail(operationKeys, 5, 'newEmail')

    operation.user.email = operation.data.email
    await operation.user.save()
    await operation.delete()
  }

  async me({ auth }: HttpContext) {
    return auth?.user
  }

  async list() {
    return await User.all()
  }

  async deleteSelf({ auth }: HttpContext) {
    return await auth.user?.delete()
  }
}
