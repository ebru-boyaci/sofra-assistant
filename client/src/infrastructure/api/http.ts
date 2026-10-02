import { syncServerClock } from '@/domain/clock'
import { ApiError, TransportError, parseRetryAfterSeconds } from './errors'

const SOFRA_NOW_HEADER = 'x-sofra-now'

export type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function captureSofraNow(res: Response): void {
  const header = res.headers.get(SOFRA_NOW_HEADER)
  if (header) syncServerClock(header)
}

async function readErrorBody(res: Response): Promise<{ code: string; message: string }> {
  try {
    const data: unknown = await res.json()
    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      data.error &&
      typeof data.error === 'object'
    ) {
      const err = data.error as Record<string, unknown>
      const code = typeof err.code === 'string' ? err.code : 'unknown'
      const message = typeof err.message === 'string' ? err.message : res.statusText
      return { code, message }
    }
  } catch {
    /* not JSON */
  }
  return { code: 'http_error', message: res.statusText || `HTTP ${res.status}` }
}

export async function apiJson<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
  const { body, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(path, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    throw new TransportError('Network request failed', cause)
  }

  captureSofraNow(res)

  if (!res.ok) {
    const { code, message } = await readErrorBody(res)
    const retryAfter =
      res.status === 429 ? parseRetryAfterSeconds(res.headers.get('Retry-After')) : null
    throw new ApiError(res.status, code, message, retryAfter)
  }

  try {
    return (await res.json()) as T
  } catch (cause) {
    throw new TransportError('Response was not valid JSON', cause)
  }
}

export async function apiJsonAllowErrorStatus<T>(
  path: string,
  init: JsonRequestInit = {},
): Promise<{ status: number; data: T }> {
  const { body, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(path, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    throw new TransportError('Network request failed', cause)
  }

  captureSofraNow(res)

  let data: T
  try {
    data = (await res.json()) as T
  } catch (cause) {
    throw new TransportError('Response body missing or not JSON', cause)
  }

  return { status: res.status, data }
}

export { captureSofraNow }
