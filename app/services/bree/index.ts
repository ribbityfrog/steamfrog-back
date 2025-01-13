import env from '#start/env'
import BreeInstance from 'bree'
import logger from '@adonisjs/core/services/logger'
import Except from '#utils/except'
import app from '@adonisjs/core/services/app'
import Wave from '#models/treatments/wave'

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
          timeout: '10 seconds',
        },
        {
          name: 'steam_enrich',
          timeout: '20 seconds',
        },
      ],
    })
  }

  async start() {
    const { job } = await this._launchLogic()

    await this._instance
      .start(job)
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

  private async _launchLogic(stoppedJob?: string): Promise<{ mode: 'run' | 'start'; job: string }> {
    const wave = await Wave.query().orderBy('wave', 'desc').first()
    if (wave === null) return { mode: 'run', job: 'steam_list' }

    if (wave.step === 'list') {
      if (stoppedJob === 'steam_list') return { mode: 'start', job: 'steam_list' }
      return { mode: 'run', job: 'steam_list' }
    }

    if (wave.step === 'enrich') {
      if (stoppedJob === 'steam_enrich') return { mode: 'start', job: 'steam_enrich' }
      return { mode: 'run', job: 'steam_enrich' }
    }

    return { mode: 'start', job: 'steam_list' }
  }

  private _initEvents() {
    this._instance.on('worker deleted', async (name) => {
      console.log(`Worker ${name} stopped`)

      const work = await this._launchLogic(name)
      if (work.mode === 'start') this._instance.start(work.job)
      else if (work.mode === 'run') this._instance.run(work.job)
    })
  }
}
