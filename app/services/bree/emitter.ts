import { isMainThread, MessagePort, parentPort } from 'node:worker_threads'
import type { BreeMessage } from '#services/bree/types'
import app from '@adonisjs/core/services/app'

class BreeEmit {
  #emitter: MessagePort | null = parentPort

  constructor() {
    if (this.#emitter === null) console.warn('No parentPort found')
    if (isMainThread)
      console.warn('[BreeEmit] is most likely being used in the main thread, which is not expected')
  }

  async failedIgnitingApp(stopExecution: boolean = false) {
    this.custom({ type: 'failed_igniting_app' }, stopExecution, true)
  }

  async failedAccessingDatabase(issue?: any, stopExecution: boolean = false) {
    this.custom({ type: 'failed_accessing_database', issue }, stopExecution, true)
  }

  async steamLimitExceeded(gameid: number = -1, stopExecution: boolean = false) {
    this.custom({ type: 'steam_limit_exceeded', data: { gameid } }, stopExecution, false)
  }

  async steamUnexpectedReject(
    gameid: number = -1,
    data?: any,
    stopExecution: boolean = false,
    exitOne: boolean = false
  ) {
    this.custom(
      { type: 'steam_unexpected_reject', issue: { gameid, data } },
      stopExecution,
      exitOne
    )
  }

  async steamUnexpectedError(
    gameid: number = -1,
    message: string = 'Unknown error',
    stopExecution: boolean = false,
    exitOne: boolean = false
  ) {
    await this.custom(
      { type: 'steam_unexpected_error', issue: { gameid, message } },
      stopExecution,
      exitOne
    )
  }

  async custom(breeMessage: BreeMessage, stopExecution: boolean = false, exitOne: boolean = false) {
    if (isMainThread) return

    this.#emitter?.postMessage(breeMessage)

    if (stopExecution) {
      if (app.isReady) await app.terminate()
      process.exit(exitOne ? 1 : 0)
    }
  }
}

const breeEmit = new BreeEmit()
export { breeEmit as default }
