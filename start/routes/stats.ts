import router from '@adonisjs/core/services/router'

const statsController = () => import('#controllers/stats/stats_controller')

export default function () {
  router
    .group(() => {
      router.get('global', [statsController, 'global'])
      router.get('undated', [statsController, 'undated'])
      router.get('windowsless', [statsController, 'windowsless'])
    })
    .prefix('stats')
}
