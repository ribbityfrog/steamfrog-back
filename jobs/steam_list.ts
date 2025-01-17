import { workerData } from 'node:worker_threads'

import SteamApp from '#models/catalogues/steam_app'
import Wave from '#models/treatments/wave'

import steamData from '#services/steam_data'

import igniteApp from '#utils/ignite_app'
import breeEmit from '#services/bree/emitter'

import { DateTime } from 'luxon'
import { SteamDataReject, SteamStoreList } from '#services/steam_data/types'
import discordMessage from '#utils/discord_message'

const app = await igniteApp(workerData.appRootString)
if (app === null) breeEmit.failedIgnitingApp()

const lastWave = await Wave.query()
  .orderBy('wave', 'desc')
  .whereNot('step', 'done')
  .first()
  .catch((err) => breeEmit.failedAccessingDatabase(err.message))

const newWave =
  lastWave !== null
    ? lastWave
    : await Wave.create({}).catch((err) => breeEmit.failedAccessingDatabase(err.message))

const wave = newWave!

if (lastWave === null)
  await wave.refresh().catch((err) => breeEmit.failedAccessingDatabase(err.message))

if (wave.step === 'enrich' || wave.step === 'stats') process.exit(0)

while (true) {
  let list: SteamStoreList | undefined

  try {
    const listResponse = await steamData.fetchStoreList(wave.lastAppid)
    list = listResponse.content
  } catch (issue) {
    const reason = issue as SteamDataReject
    if (reason.status === 429) breeEmit.steamLimitExceeded()
    else breeEmit.steamUnexpectedReject(-1, reason)
  }

  if (list === undefined) process.exit(1)

  while (list.apps?.length > 0) {
    let iteStep = 1000

    const sublist: Partial<SteamApp>[] = list.apps
      .splice(0, list.apps.length > iteStep ? iteStep : list.apps.length)
      .map((steamApp) => ({
        id: steamApp.appid,
        name: steamApp.name,
        isEnriched: false,
        storeUpdatedAt: DateTime.fromSeconds(steamApp.last_modified),
      }))

    console.log(
      `Insert from ${sublist[0].id} to ${sublist[sublist.length - 1].id}, ${sublist.length} new apps, ${list.apps.length} left`
    )

    await SteamApp.updateOrCreateMany('id', sublist).catch((err) =>
      breeEmit.failedAccessingDatabase(err.message)
    )
    wave.lastAppid = sublist[sublist.length - 1].id!
    await wave.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
  }

  // if (!list?.have_more_results) {
  wave.step = 'enrich'
  await wave.save().catch((err) => breeEmit.failedAccessingDatabase(err.message))
  await discordMessage.custom('[steamData] Steam listing done')
  break
  // }
}

process.exit(0)
