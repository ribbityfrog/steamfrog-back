import { workerData } from 'node:worker_threads'
import { parentPort } from 'node:worker_threads'
import process from 'node:process'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import { DateTime } from 'luxon'
import igniteApp from '#utils/ignite_app'

const app = await igniteApp(workerData.appRootString)
if (app === null) process.exit(1)

const lastWave = await Wave.query().orderBy('wave', 'desc').whereNot('step', 'done').first()

const wave = lastWave !== null ? lastWave : await Wave.create({})
if (wave === null) process.exit(1)
if (lastWave === null) await wave.refresh()

if (wave.step === 'enrich' || wave.step === 'stats') process.exit(0)

console.log(wave.lastAppid)

while (true) {
  const list = await steamData.getList(wave.lastAppid)

  if (list === null) break

  while (list?.apps?.length > 0) {
    let iteStep = 1000

    const sublist: Partial<SteamApp>[] = list.apps
      .splice(0, list.apps.length > iteStep ? iteStep : list.apps.length)
      .map((steamApp) => ({
        id: steamApp.appid,
        name: steamApp.name,
        storeUpdatedAt: DateTime.fromSeconds(steamApp.last_modified),
      }))

    console.log(
      `Insert from ${sublist[0].id} to ${sublist[sublist.length - 1].id}, ${sublist.length} new apps, ${list.apps.length} left`
    )

    try {
      await SteamApp.updateOrCreateMany('id', sublist)
      wave.lastAppid = sublist[sublist.length - 1].id!
      await wave.save()
    } catch (e) {
      console.error('SteamApps sublist insert error', e)
      break
    }
  }

  console.log(list)
  console.log(list !== null)
  console.log(!list?.have_more_results)

  if (!list?.have_more_results) {
    wave.step = 'enrich'
    await wave.save()
    break
  }
}

if (parentPort) parentPort.postMessage('done')
else process.exit(0)
