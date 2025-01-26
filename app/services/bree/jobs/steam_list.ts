import igniteApp from '#utils/ignite_worker_app'

import steamData from '#services/steam_data'

import breeEmit from '#services/bree/emitter'

import { DateTime } from 'luxon'
import { SteamDataReject, SteamStoreList } from '#services/steam_data/types'
import discordMessage from '#utils/discord_message'
import env from '#start/env'

const app = await igniteApp()

const { default: SteamApp } = await import('#models/catalogues/steam_app')
const { default: Wave } = await import('#models/treatments/wave')
type SteamAppType = InstanceType<typeof SteamApp>

const lastWave = await Wave.query()
  .orderBy('wave', 'desc')
  .whereNot('step', 'done')
  .first()
  .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

const newWave =
  lastWave !== null
    ? lastWave
    : await Wave.create({})
        .then(async (wave) => {
          await discordMessage.custom('(worker_steam-list) New wave has been started')
          return wave
        })
        .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

const wave = newWave!

if (lastWave === null)
  await wave
    .refresh()
    .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))

if (wave.step === 'enrich' || wave.step === 'stats') {
  await app!.terminate()
  process.exit(0)
}

while (true) {
  let list: SteamStoreList | undefined

  try {
    const listResponse = await steamData.fetchStoreList(wave.lastAppid, 100)
    list = listResponse.content
  } catch (issue) {
    const reason = issue as SteamDataReject
    if (reason.status === 429) await breeEmit.steamLimitExceeded(-1, true)
    else await breeEmit.steamUnexpectedReject(-1, reason, true)
  }

  if (list === undefined) {
    await app!.terminate()
    process.exit(1)
  }

  while (list.apps?.length > 0) {
    let iteStep = 10

    const sublist: Partial<SteamAppType>[] = list.apps
      .splice(0, list.apps.length > iteStep ? iteStep : list.apps.length)
      .map((steamApp) => ({
        id: steamApp.appid,
        name: steamApp.name,
        isEnriched: false,
        storeUpdatedAt: DateTime.fromSeconds(steamApp.last_modified),
      }))

    if (env.get('NODE_ENV') !== 'production')
      console.log(
        `Insert from ${sublist[0].id} to ${sublist[sublist.length - 1].id}, ${sublist.length} new apps, ${list.apps.length} left`
      )

    await SteamApp.updateOrCreateMany('id', sublist).catch(
      async (err) => await breeEmit.failedAccessingDatabase(err.message, true)
    )
    wave.lastAppid = sublist[sublist.length - 1].id!
    await wave
      .save()
      .catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
  }

  // if (!list?.have_more_results) {
  wave.step = 'enrich'
  await wave.save().catch(async (err) => await breeEmit.failedAccessingDatabase(err.message, true))
  await discordMessage.custom('(steamData) Steam listing done')
  break
  // }
}

await app!.terminate()
process.exit(0)
