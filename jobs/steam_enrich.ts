import { workerData } from 'node:worker_threads'
import { parentPort } from 'node:worker_threads'
import process from 'node:process'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import igniteApp from '#utils/ignite_app'

const app = await igniteApp(workerData.appRootString)
if (app === null) process.exit(1)

const wave = await Wave.query().orderBy('wave', 'desc').where('step', 'enrich').first()

if (wave === null) process.exit(0)

console.log(wave)

if (parentPort) parentPort.postMessage('done')
else process.exit(0)
