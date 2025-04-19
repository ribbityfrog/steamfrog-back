import router from '@adonisjs/core/services/router'

const toolsController = () => import('#controllers/tools/tools_controller')

export default function () {
  router
    .group(() => {
      router.post('naming', [toolsController, 'naming']) // Body checked in the endpoint
    })
    .prefix('/tools')
}
