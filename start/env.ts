/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  /*
  |----------------------------------------------------------
  | Variables for configuring node and HTTP server
  |----------------------------------------------------------
  */
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  CORS: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring magic links
  |----------------------------------------------------------
  */
  FRONT_ORIGIN: Env.schema.string(),
  MAGIC_CONNECT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring mail service
  |----------------------------------------------------------
  */
  BV_API_KEY: Env.schema.string(),
  BV_SENDER_EMAIL_DEFAULT: Env.schema.string({ format: 'email' }),
  BV_SENDER_NAME_DEFAULT: Env.schema.string(),
  BV_RECEIVER_TEST: Env.schema.string({ format: 'email' }),

  /*
  |----------------------------------------------------------
  | Variables for configuring S3 storage service
  |----------------------------------------------------------
  */
  S3_ACCESS_KEY_ID: Env.schema.string(),
  S3_SECRET_ACCESS_KEY: Env.schema.string(),
  S3_REGION: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string(),
  S3_ACL: Env.schema.boolean(),
  S3_VISIBILITY: Env.schema.enum(['public', 'private'] as const),
})
