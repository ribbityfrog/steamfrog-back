import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

import Catalogue from '#models/catalogues/catalogue'
import steamData from '#services/steam_data'
import Wave from '#models/treatments/wave'
import db from '@adonisjs/lucid/services/db'
import Category from '#models/catalogues/category'
import Tag from '#models/catalogues/tag'

export default class SandboxesController {
  async progress() {
    const wave = await Wave.query().select().orderBy('wave', 'desc').first()

    const steamAppsExtract = await Catalogue.query()
      .where('are_details_enriched', true)
      .orderBy('id', 'desc')
      .limit(12)
    const steamAppsCount = await db.from(Catalogue.table).count('*')
    const enrichedDetailsCount = await db
      .from(Catalogue.table)
      .where('are_details_enriched', true)
      .count('*')
    const outerAppsCount = await db.from(Catalogue.table).where('app_type', 'outer').count('*')
    const brokenApps = await Catalogue.query().where('app_type', 'broken')
    const trashedApps = await Catalogue.query().where('app_type', 'trash')

    return {
      wave: {
        ...wave?.$attributes,
        duration: wave?.updatedAt.diff(wave.createdAt).as('minutes'),
      },
      badApples: {
        broken: {
          count: brokenApps.length,
          list: brokenApps,
        },
        trash: {
          count: trashedApps.length,
          list: trashedApps,
        },
      },
      apps: {
        totalCount: Number(steamAppsCount[0].count),
        enrichedCount: Number(enrichedDetailsCount[0].count),
        outerCount: Number(outerAppsCount[0].count),
        lastEnriched: steamAppsExtract,
      },
    }
  }

  async app({ params }: HttpContext) {
    const appid = +params.appid

    if (Number.isNaN(appid)) return 'The appid is not a valid number'

    return {
      appDetails: await steamData.fetchAppDetails(appid, true),
      itemPage: await steamData.fetchStoreItem([appid], true),
      reviews: await steamData.fetchReviews(appid, true),
      achievements: await steamData.fetchAchievements(appid, true),
    }
  }

  async stats() {
    // const totals = await Catalogue.statsTotals()
    // const games = await Catalogue.statsGames()
    // const platforms = await Catalogue.statsPlatforms()
    // const notOnWindows = await Catalogue.notOnWindows()
    // return { totals, games, platforms, notOnWindows }
  }

  async edit() {
    if (env.get('NODE_ENV', 'production') !== 'development') return 'no edit in production'

    // const sApp = await Catalogue.query().where('app_type', 'broken').update({ app_type: 'new' })
    // const sApp = await Catalogue.findBy('id', 774161)
    // if (!sApp) return 'nothing to edit'

    // sApp.isEnriched = false
    // sApp.appType = 'new'
    // await sApp.save()

    // return sApp
  }

  async catags() {
    return {
      categories: await Category.all(),
      tags: await Tag.all(),
    }
  }
}
