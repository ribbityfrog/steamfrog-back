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
AccountsRoutes()

router.get('/', () => 'Hello :)')
router.get('/favicon.ico', () => 'Not a website ^^')

const sandboxesController = () => import('#controllers/sandboxes_controller')

router.get('/sand', [sandboxesController, 'sand'])
router.get('/sandGuarded', [sandboxesController, 'sand']).use(middleware.auth({ guards: ['api'] }))
router
  .get('/sandAdmin', [sandboxesController, 'sand'])
  .use(middleware.auth({ guards: ['api'] }))
  .use(middleware.admin())

const explorersController = () => import('#controllers/explorers_controller')

router
  .group(() => {
    router.get('progress', [explorersController, 'progress'])
    router.get('app/:appid', [explorersController, 'app'])
    router.get('stats', [explorersController, 'stats'])
    router.get('edit', [explorersController, 'edit'])
    router.get('catags', [explorersController, 'catags'])
    router.get('studios', [explorersController, 'studios'])
    router.get('franchises', [explorersController, 'franchises'])
    router.get('descriptors', [explorersController, 'descriptors'])
    router.get('languages', [explorersController, 'languages'])
    router.get('reviews', [explorersController, 'reviews'])
    router.get('achievements', [explorersController, 'achievements'])
  })
  .prefix('explore')
