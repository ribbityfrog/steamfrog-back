import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('POSTGRESQL_ADDON_HOST'),
        port: env.get('POSTGRESQL_ADDON_PORT'),
        user: env.get('POSTGRESQL_ADDON_USER'),
        password: env.get('POSTGRESQL_ADDON_PASSWORD'),
        database: env.get('POSTGRESQL_ADDON_DB'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
