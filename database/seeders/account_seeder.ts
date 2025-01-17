import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/accounts/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreateMany('email', [
      {
        email: 'catch@preprod.tech',
        isAdmin: true,
      },
    ])
  }
}
