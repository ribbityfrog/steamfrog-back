import Operation from '#models/accounts/operation'
import User from '#models/accounts/user'
import { OperationKeys } from '#schemas/accounts/operation'
import Except from '#utils/except'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class ConnectionsController {
  async connect({ request }: HttpContext) {
    const operationKeys = request.body() as OperationKeys

    const operation = await Operation.useOrFail(operationKeys, 5, 'connect')
    const token = await User.accessTokens.create(operation.user, [
      operation.user.isAdmin ? 'admin' : 'user',
    ])
    operation.user.lastConnection = DateTime.now()
    await operation.user.save()
    await operation.delete()

    return token
  }

  async list() {
    return await db.from('accounts.connections').select(['id', 'name'])
  }

  async listSelf({ auth }: HttpContext) {
    if (!auth?.user) return Except.entryNotFound()

    return await db
      .from('accounts.connections')
      .select(['id', 'name'])
      .where('tokenable_id', auth.user.id)
  }

  async logout({ auth }: HttpContext) {
    if (!auth?.user) {
      Except.entryNotFound()
      return
    }
    return await User.accessTokens.delete(auth.user, auth.user.currentAccessToken.identifier)
  }
}
