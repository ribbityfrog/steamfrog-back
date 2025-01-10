import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

import userSchema from '#schemas/accounts/user'
import operationKeysSchema from '#schemas/accounts/operation'

const accountsUsersController = () => import('#controllers/accounts/users_controller')
const accountsConnectionsController = () => import('#controllers/accounts/connections_controller')
const accountsOperationsController = () => import('#controllers/accounts/operations_controller')

export default function () {
  router
    .group(() => {
      router
        .group(() => {
          router.post('create', [accountsUsersController, 'create'])
          router.post('login', [accountsOperationsController, 'login'])

          router
            .post('newEmail', [accountsOperationsController, 'newEmail'])
            .use(middleware.auth({ guards: ['api'] }))
        })
        .use(middleware.validateBody(userSchema.pick({ email: true })))
        .prefix('request')

      router
        .group(() => {
          router.post('connect', [accountsConnectionsController, 'connect'])
          router.post('newEmail', [accountsUsersController, 'newEmail'])
        })
        .use(middleware.validateBody(operationKeysSchema))
        .prefix('operation')

      router
        .group(() => {
          router.delete('deleteSelf', [accountsUsersController, 'deleteSelf'])
        })
        .use(middleware.auth({ guards: ['api'] }))
    })
    .prefix('/accounts')

  router
    .group(() => {
      router.get('listSelf', [accountsConnectionsController, 'listSelf'])
      router.get('list', [accountsConnectionsController, 'list']).use(middleware.admin())
      router.delete('logout', [accountsConnectionsController, 'logout'])
    })
    .prefix('/connections')
    .use(middleware.auth({ guards: ['api'] }))

  router
    .group(() => {
      router.get('me', [accountsUsersController, 'me'])
      router.get('list', [accountsUsersController, 'list']).use(middleware.admin())
    })
    .prefix('/users')
    .use(middleware.auth({ guards: ['api'] }))
}
