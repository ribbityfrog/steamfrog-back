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

  failedAccessingDatabase(issue?: any) {
    console.log(issue)
    this.custom({ type: 'failed_accessing_database', issue }, true)
  }

  steamLimitExceeded(gameid: number = -1) {
    this.custom({ type: 'steam_limit_exceeded', data: { gameid } }, true)
  }

  custom(breeMessage: BreeMessage, stopExecution: boolean = false) {
    this.#emitter?.postMessage(breeMessage)

    if (stopExecution) process.exit(0)
    // if (stopExecution) this.done()
  }

  done() {
    if (this.#emitter) this.#emitter.postMessage('done')
    else process.exit(0)
  }
}

const breeEmit = new BreeEmit()
export { breeEmit as default }
