import { workerData } from 'node:worker_threads'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import igniteApp from '#utils/ignite_app'
import breeEmit from '#services/bree/emitter'

const app = await igniteApp(workerData.appRootString)
if (app === null) breeEmit.failedIgnitingApp()

const wave = await Wave.query()
  .select('error')
  .orderBy('wave', 'desc')
  .where('step', 'enrich')
  .first()
  .catch((err) => breeEmit.failedAccessingDatabase(err.message))

breeEmit.done()
