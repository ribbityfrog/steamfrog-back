import router from '@adonisjs/core/services/router'
// import { middleware } from '#start/kernel'

const explorersController = () => import('#controllers/explorers_controller')

export default function () {
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
  // .use(middleware.auth({ guards: ['api'] }))
  // .use(middleware.admin())
}
