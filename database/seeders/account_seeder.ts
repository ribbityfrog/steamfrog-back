import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/accounts/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreateMany('email', [
      {
        email: 'catch@preprod.tech',
        isAdmin: true,
      },
      {
        email: 'a@a.aa',
      },
      {
        email: 'b@b.bb',
      },
      {
        email: 'c@c.cc',
        isAdmin: true,
      },
      {
        email: 'd@d.dd',
      },
      {
        email: 'e@e.ee',
      },
    ])
  }
}
