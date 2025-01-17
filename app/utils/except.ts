import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { ExceptIntels } from '#utils/except/types'
import type { ExceptAbort } from '#utils/except/types'
import discordMessage from '#utils/discord_message'

type OptionalData = {
  debug?: any
  payload?: any
}

export default class Except {
  private _intels: ExceptIntels
  private _trace: Error
  private _ctx: HttpContext | null
  private _abort: ExceptAbort
  private _debug?: any
  private _payload?: any

  get isHttpContext(): boolean {
    return this._ctx !== null
  }

  get intels(): ExceptIntels {
    return this._intels
  }

  get error(): Error {
    return this._trace
  }

  get stack(): string | undefined {
    return this._trace.stack
  }
  get cleanStack(): string | undefined {
    if (this._trace?.stack === undefined) return undefined

    return this._trace.stack
      .split('\n')
      .filter((line: string) => !line.includes('node_modules'))
      .join('\n')
  }

  get isAborted(): boolean {
    return (
      this._abort === 'both' ||
      (this.isHttpContext === true && this._abort === 'http') ||
      (this.isHttpContext === false && this._abort === 'intern')
    )
  }

  get statusRange(): number {
    return Math.trunc(this._intels.status / 100) * 100
  }

  get debug(): any {
    return this._debug
  }
  get payload(): any {
    return this._payload
  }

  private constructor(intels?: Partial<ExceptIntels>, abort?: ExceptAbort, data?: OptionalData) {
    this._ctx = HttpContext.get()
    this._intels = {
      ...{ status: 418, code: 'IM_A_TEAPOT', critical: false },
      ...intels,
    }

    this._trace = new Error('Trace')
    this._abort = abort ?? 'both'

    this._debug = data?.debug
    this._payload = data?.payload
  }

  private _launch() {
    const logs: {
      intels: ExceptIntels
      aborted: boolean
      debug?: any
      url?: string
      stack?: string
    } = {
      intels: this.intels,
      aborted: this.isAborted,
    }
    if (this._debug !== undefined) logs.debug = this._debug

    if (this.isHttpContext) {
      this._ctx?.response.status(this._intels.status).send(this._intels)
      logs.url = this._ctx?.request?.completeUrl()
    }

    logs.stack = this.cleanStack

    if (this.intels.critical === true) logger.fatal(logs)
    else if (this.statusRange === 400) logger.warn(logs)
    else logger.error(logs)

    if (this.statusRange === 500 || this.intels.critical) {
      discordMessage.exceptError(logs)
    }

    if (this.isAborted) {
      if (this.isHttpContext === false) throw this._intels
      else this._ctx?.response.abort(this._intels, this._intels.status)
    }
  }

  static custom(): void
  static custom(intels?: Partial<ExceptIntels>, abort?: ExceptAbort): void
  static custom(intels?: Partial<ExceptIntels>, optionalData?: OptionalData): void
  static custom(
    intels?: Partial<ExceptIntels>,
    abort?: ExceptAbort,
    optionalData?: OptionalData
  ): void
  static custom(intels?: Partial<ExceptIntels>, param2?: any, param3?: any): void {
    let abort: ExceptAbort | undefined
    let optionalData: OptionalData | undefined

    if (param2 !== undefined) {
      if (typeof param2 === 'object') optionalData = param2
      else abort = param2
    }
    if (param3 !== undefined) optionalData = param3

    const except = new Except(intels, abort, optionalData)
    except._launch()
  }

  static imATeapot(): void
  static imATeapot(abort: ExceptAbort): void
  static imATeapot(optionalData: OptionalData): void
  static imATeapot(abort: ExceptAbort, optionalData: OptionalData): void
  static imATeapot(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 418,
        code: 'IM_A_TEAPOT',
        message: "I'm a teapot",
      },
      param1,
      param2
    )
  }

  static routeNotFound(): void
  static routeNotFound(abort: ExceptAbort): void
  static routeNotFound(optionalData: OptionalData): void
  static routeNotFound(abort: ExceptAbort, optionalData: OptionalData): void
  static routeNotFound(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 404,
        code: 'ROUTE_NOT_FOUND',
        message: 'No endpoint has been found at that url',
      },
      param1,
      param2
    )
  }

  static entryNotFound(): void
  static entryNotFound(abort: ExceptAbort): void
  static entryNotFound(optionalData: OptionalData): void
  static entryNotFound(abort: ExceptAbort, optionalData: OptionalData): void
  static entryNotFound(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 404,
        code: 'ENTRY_NOT_FOUND',
        message: 'The researched entry has not been found',
      },
      param1,
      param2
    )
  }

  static unauthorized(): void
  static unauthorized(abort: ExceptAbort): void
  static unauthorized(optionalData: OptionalData): void
  static unauthorized(abort: ExceptAbort, optionalData: OptionalData): void
  static unauthorized(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to access this resource',
      },
      param1,
      param2
    )
  }

  static forbidden(): void
  static forbidden(abort: ExceptAbort): void
  static forbidden(optionalData: OptionalData): void
  static forbidden(abort: ExceptAbort, optionalData: OptionalData): void
  static forbidden(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not authorized to access this resource',
      },
      param1,
      param2
    )
  }

  static conflict(): void
  static conflict(abort: ExceptAbort): void
  static conflict(optionalData: OptionalData): void
  static conflict(abort: ExceptAbort, optionalData: OptionalData): void
  static conflict(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 409,
        code: 'CONFLICT',
        message: 'Conflict the current state of the resource',
      },
      param1,
      param2
    )
  }

  static unprocessableEntity(): void
  static unprocessableEntity(abort: ExceptAbort): void
  static unprocessableEntity(optionalData: OptionalData): void
  static unprocessableEntity(abort: ExceptAbort, optionalData: OptionalData): void
  static unprocessableEntity(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: 'The request cannot be processed, please verify your body',
      },
      param1,
      param2
    )
  }

  static timeOut(): void
  static timeOut(abort: ExceptAbort): void
  static timeOut(optionalData: OptionalData): void
  static timeOut(abort: ExceptAbort, optionalData: OptionalData): void
  static timeOut(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 408,
        code: 'TIMEOUT',
        message: 'The request has timed out',
      },
      param1,
      param2
    )
  }

  static contentTooLarge(): void
  static contentTooLarge(abort: ExceptAbort): void
  static contentTooLarge(optionalData: OptionalData): void
  static contentTooLarge(abort: ExceptAbort, optionalData: OptionalData): void
  static contentTooLarge(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 413,
        code: 'CONTENT_TOO_LARGE',
        message: 'The request content is too large',
      },
      param1,
      param2
    )
  }

  static unsupportedMediaType(): void
  static unsupportedMediaType(abort: ExceptAbort): void
  static unsupportedMediaType(optionalData: OptionalData): void
  static unsupportedMediaType(abort: ExceptAbort, optionalData: OptionalData): void
  static unsupportedMediaType(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 415,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'The request content media type is not supported',
      },
      param1,
      param2
    )
  }

  static expectationFailed(): void
  static expectationFailed(abort: ExceptAbort): void
  static expectationFailed(optionalData: OptionalData): void
  static expectationFailed(abort: ExceptAbort, optionalData: OptionalData): void
  static expectationFailed(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 417,
        code: 'EXPECTATION_FAILED',
        message: 'The expectation failed',
      },
      param1,
      param2
    )
  }

  static internalServerError(): void
  static internalServerError(abort: ExceptAbort): void
  static internalServerError(optionalData: OptionalData): void
  static internalServerError(abort: ExceptAbort, optionalData: OptionalData): void
  static internalServerError(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
      param1,
      param2
    )
  }

  static badGateway(): void
  static badGateway(abort: ExceptAbort): void
  static badGateway(optionalData: OptionalData): void
  static badGateway(abort: ExceptAbort, optionalData: OptionalData): void
  static badGateway(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 502,
        code: 'BAD_GATEWAY',
        message: 'Bad gateway',
      },
      param1,
      param2
    )
  }

  static serviceUnavailable(): void
  static serviceUnavailable(abort: ExceptAbort): void
  static serviceUnavailable(optionalData: OptionalData): void
  static serviceUnavailable(abort: ExceptAbort, optionalData: OptionalData): void
  static serviceUnavailable(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
      },
      param1,
      param2
    )
  }

  static gatewayTimeout(): void
  static gatewayTimeout(abort: ExceptAbort): void
  static gatewayTimeout(optionalData: OptionalData): void
  static gatewayTimeout(abort: ExceptAbort, optionalData: OptionalData): void
  static gatewayTimeout(param1?: any, param2?: any): void {
    Except.custom(
      {
        status: 504,
        code: 'GATEWAY_TIMEOUT',
        message: 'Gateway timeout',
      },
      param1,
      param2
    )
  }
}
