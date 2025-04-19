import Catalogue from '#models/catalogues/catalogue'
import Except from '#utils/except'
import type { HttpContext } from '@adonisjs/core/http'

export default class ToolsController {
  async naming({ request }: HttpContext) {
    const body = request.body()

    const keywords = body.keywords as string[]
    const andor = (body.andor as boolean) ?? false

    if (keywords.length >= 16 || keywords.some((k) => k.length > 32))
      return Except.unprocessableEntity()

    const counter = await Catalogue.query()
      .withScopes((sco) => sco.treatable())
      .where('app_type', 'game')
      .andWhere((sub) => {
        for (const kw of keywords)
          andor
            ? sub.orWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
            : sub.andWhereRaw('LOWER(name) LIKE ?', [`%${kw}%`])
      })
      .count('* as count')

    return counter[0].$extras.count
  }
}
