import { MessagePort, parentPort } from 'node:worker_threads'
import type { BreeMessage } from '#services/bree/types'

class BreeEmit {
  #emitter: MessagePort | null = parentPort

  constructor() {
    if (this.#emitter === null) console.warn('No parentPort found')
  }

  failedIgnitingApp() {
    this.custom({ type: 'failed_igniting_app' }, true)
  }

  failedAccessingDatabase(issue?: any, stopExecution: boolean = true) {
    console.log(issue)
    this.custom({ type: 'failed_accessing_database', issue }, stopExecution)
  }

  steamLimitExceeded(gameid: number = -1, stopExecution: boolean = true) {
    this.custom({ type: 'steam_limit_exceeded', data: { gameid } }, stopExecution)
  }

  steamUnexpectedReject(gameid: number = -1, data?: any) {
    this.custom({ type: 'steam_unexpected_reject', issue: { gameid, data } }, false)
  }

  steamUnexpectedError(gameid: number = -1, message: string = 'Unknown error') {
    this.custom({ type: 'steam_unexpected_error', issue: { gameid, message } }, false)
  }

  custom(breeMessage: BreeMessage, stopExecution: boolean = false) {
    this.#emitter?.postMessage(breeMessage)

    if (stopExecution) process.exit(1)
  }
}

const breeEmit = new BreeEmit()
export { breeEmit as default }
