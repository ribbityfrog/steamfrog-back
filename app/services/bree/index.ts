import env from '#start/env'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import BreeInstance from 'bree'
import logger from '@adonisjs/core/services/logger'
import Except from '#utils/except'

export default class Bree {
  private _instance: BreeInstance
  private _ready: boolean = false

  get instance(): BreeInstance {
    return this._instance
  }

  get isReady(): boolean {
    return this._ready
  }

  constructor() {
    this._instance = new BreeInstance({
      root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),

      defaultExtension: env.get('NODE_ENV', 'production') === 'production' ? 'js' : 'ts',

      jobs: [
        {
          name: 'steamscrap',
          timeout: '3 minutes',
          // interval: 'every 5 seconds',
        },
      ],
    })
  }

  async init() {
    await this._instance
      .start()
      .then(() => {
        this._initEvents()
        logger.info('[service] Bree - Started properly')
      })
      .catch((error) =>
        Except.serviceUnavailable('none', {
          debug: { message: '[service] Bree - Failed to start', error },
        })
      )
  }

  private _initEvents() {
    this._instance.on('worker deleted', (name) => {
      console.log(`Worker ${name} stopped`)
      // this._instance.start('steamscrap')
    })
  }
}
