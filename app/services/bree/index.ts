import env from '#start/env'
import BreeInstance from 'bree'
import Except from '#utils/except'
import logger from '@adonisjs/core/services/logger'
import app from '@adonisjs/core/services/app'
import Wave from '#models/treatments/wave'

export default class Bree {
  private _instance: BreeInstance
  private _isReady: boolean = false

  get instance(): BreeInstance {
    return this._instance
  }

  get isReady(): boolean {
    return this._isReady
  }

  constructor() {
    this._instance = new BreeInstance({
      // root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),

      defaultExtension: env.get('NODE_ENV', 'production') === 'production' ? 'js' : 'ts',
      logger: env.get('NODE_ENV', 'production') === 'production' ? false : console,

      worker: {
        workerData: {
          appRootString: app.appRoot.href,
        },
      },

      jobs: [
        {
          name: 'steam_list',
          timeout: '5 minutes',
        },
        {
          name: 'steam_enrich',
          timeout: '5 minutes',
        },
      ],

      workerMessageHandler: (worker) => {
        if (worker.message === 'done') return
        logger.info(`[Bree] Received ${worker.message.type} from ${worker.name}`)
        this._instance.emit(worker.message.type, worker)
      },
    })
  }

  async start() {
    const worker = await this._launchLogic()

    if (worker === null) return

    await this._instance
      .run(worker.job)
      .then(() => {
        this._initEvents()
        logger.info('[service] Bree - Started properly')
        this._isReady = true
      })
      .catch((error) =>
        Except.serviceUnavailable('none', {
          debug: { message: '[service] Bree - Failed to start', error },
        })
      )
  }

  private async _launchLogic(
    stoppedJob?: string
  ): Promise<{ mode: 'run' | 'start'; job: string } | null> {
    const wave = await Wave.query()
      .orderBy('wave', 'desc')
      .first()
      .catch(() => logger.error('[service] Bree - Failed to get Wave and decide of the logic'))

    if (wave === undefined) return null
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
    this._instance.on('worker created', async (name) =>
      logger.info(`[Bree] Worker "${name}" started`)
    )

    this._instance.on('worker deleted', async (name) => {
      logger.info(`[Bree] Worker "${name}" stopped`)

      const work = await this._launchLogic(name)

      if (work === null) logger.error('[service] Bree - Failed stat next steam logic')
      else if (work.mode === 'start') this._instance.start(work.job)
      else if (work.mode === 'run') this._instance.run(work.job)
    })

    this._instance.on('failed_accessing_database', async (worker) => {
      logger.error(
        `[Bree] Failed accessing database for ${worker.name}: ${worker?.message?.issue ?? worker?.message ?? worker}`
      )
    })

    this._instance.on('steam_limit_exceeded', async (worker) => {
      logger.warn(
        `[Bree] steam limit exceeded in ${worker.name} for ${worker?.message?.data?.gameid}`
      )
    })
  }
}
