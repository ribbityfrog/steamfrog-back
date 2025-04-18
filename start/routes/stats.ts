import router from '@adonisjs/core/services/router'

const statsController = () => import('#controllers/stats/stats_controller')

export default function () {
  router
    .group(() => {
      // router.get('global', [statsController, 'global'])
      // router.get('undated', [statsController, 'undated'])
      // router.get('windowsless', [statsController, 'windowsless'])
      router.get('brokens', [statsController, 'brokens'])

      router
        .group(() => {
          router.get('count', [statsController, 'count'])
          router.get('maturity', [statsController, 'maturity'])
          router.get('finance', [statsController, 'finance'])
          router.get('platforms', [statsController, 'platforms'])
          router.get('dates', [statsController, 'dates'])
        })
        .prefix('temp')
    })
    .prefix('/stats')
}
