
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryAfterSeconds: number | null

  constructor(
    status: number,
    code: string,
    message: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }

  get isRetryableHttp(): boolean {
    return this.status === 429 || this.status >= 500
  }
}

export class TransportError extends Error {
  readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'TransportError'
    this.cause = cause
  }
}

export function parseRetryAfterSeconds(header: string | null): number | null {
  if (header === null || header === '') return null
  const asInt = Number.parseInt(header, 10)
  if (!Number.isNaN(asInt) && asInt >= 0) return asInt
  const asDate = Date.parse(header)
  if (!Number.isNaN(asDate)) {
    const seconds = Math.ceil((asDate - Date.now()) / 1000)
    return Math.max(0, seconds)
  }
  return null
}
