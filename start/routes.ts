/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Routes
import AccountsRoutes from '#routes/accounts'

router.get('/', () => 'Hello :)')
router.get('/favicon.ico', () => 'Not a website ^^')

const sandboxesController = () => import('#controllers/sandboxes_controller')

router.get('/sand', [sandboxesController, 'sand'])
router.get('/sandGuarded', [sandboxesController, 'sand']).use(middleware.auth({ guards: ['api'] }))
router
  .get('/sandAdmin', [sandboxesController, 'sand'])
  .use(middleware.auth({ guards: ['api'] }))
  .use(middleware.admin())

AccountsRoutes()

router.get('/check/:appid', [sandboxesController, 'check'])
