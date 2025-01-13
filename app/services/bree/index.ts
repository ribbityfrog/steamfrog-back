import env from '#start/env'
import BreeInstance from 'bree'
import logger from '@adonisjs/core/services/logger'
import Except from '#utils/except'
import app from '@adonisjs/core/services/app'

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
      // root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),

      defaultExtension: env.get('NODE_ENV', 'production') === 'production' ? 'js' : 'ts',

      worker: {
        workerData: {
          appRootString: app.appRoot.href,
        },
      },

      jobs: [
        {
          name: 'steam_list',
          timeout: '3 seconds',
          // interval: 'every 5 seconds',
        },
      ],
    })
  }

  async start() {
    await this._instance
      .start()
      .then(() => {
        this._initEvents()
        logger.info('[service] Bree - Started properly')
        this._ready = true
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
