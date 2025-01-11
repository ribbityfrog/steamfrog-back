import { parentPort } from 'node:worker_threads'
import process from 'node:process'

// const timer = (ms: number) => new Promise((res) => setTimeout(res, ms * 1000))

if (parentPort) parentPort.postMessage('done')
else process.exit(0)
