import { MessagePort, parentPort } from 'node:worker_threads'
import type { BreeMessage } from '#services/bree/types'
import app from '@adonisjs/core/services/app'

class BreeEmit {
  #emitter: MessagePort | null = parentPort

  constructor() {
    if (this.#emitter === null) console.warn('No parentPort found')
  }

  failedIgnitingApp(stopExecution: boolean = false) {
    this.custom({ type: 'failed_igniting_app' }, stopExecution)
  }

  failedAccessingDatabase(issue?: any, stopExecution: boolean = false) {
    console.log(issue)
    this.custom({ type: 'failed_accessing_database', issue }, stopExecution)
  }

  steamLimitExceeded(gameid: number = -1, stopExecution: boolean = false) {
    this.custom({ type: 'steam_limit_exceeded', data: { gameid } }, stopExecution)
  }

  steamUnexpectedReject(gameid: number = -1, data?: any, stopExecution: boolean = false) {
    this.custom({ type: 'steam_unexpected_reject', issue: { gameid, data } }, stopExecution)
  }

  steamUnexpectedError(
    gameid: number = -1,
    message: string = 'Unknown error',
    stopExecution: boolean = false
  ) {
    this.custom({ type: 'steam_unexpected_error', issue: { gameid, message } }, stopExecution)
  }

  custom(breeMessage: BreeMessage, stopExecution: boolean = false) {
    this.#emitter?.postMessage(breeMessage)

    if (stopExecution) {
      if (app.isReady) app.terminate()
      process.exit(1)
    }
  }
}

const breeEmit = new BreeEmit()
export { breeEmit as default }
