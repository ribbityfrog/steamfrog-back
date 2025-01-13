import { workerData } from 'node:worker_threads'
import { parentPort } from 'node:worker_threads'
import process from 'node:process'

import SteamApp from '#models/catalogues/steam_app'

import steamData from '#services/steam_data'

import { DateTime } from 'luxon'
import igniteApp from '#utils/ignite_app'

const app = await igniteApp(workerData.appRootString)
if (app === null) process.exit(1)

let lastAppid = 0

while (lastAppid === 0) {
  const list = await steamData.getList(lastAppid, 100)

  if (list === null) break

  const steamList: Partial<SteamApp>[] = list.apps.map((steamApp) => ({
    id: steamApp.appid,
    name: steamApp.name,
    appType: 'new',
    storeUpdatedAt: DateTime.fromSeconds(steamApp.last_modified),
  }))

  await SteamApp.updateOrCreateMany('id', steamList)

  if (list.have_more_results === true && list.last_appid !== undefined) lastAppid = list.last_appid
  else break
}

if (parentPort) parentPort.postMessage('done')
else process.exit(0)
