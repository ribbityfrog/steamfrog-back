export type ExceptIntels = {
  status: number
  code: ExceptCode
  message?: string
  critical: boolean
}

export type ExceptAbort = 'http' | 'intern' | 'both' | 'none'

const exceptCodes = [
  'IM_A_TEAPOT',
  'ROUTE_NOT_FOUND',
  'ENTRY_NOT_FOUND',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'CONFLICT',
  'UNPROCESSABLE_ENTITY',
  'TIMEOUT',
  'CONTENT_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'EXPECTATION_FAILED',
  'INTERNAL_SERVER_ERROR',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
] as const
export type ExceptCode = (typeof exceptCodes)[number]
