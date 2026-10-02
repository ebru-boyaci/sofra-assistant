import { syncServerClock } from '@/domain/clock'
import type { AssembledStream } from '@/infrastructure/streaming'
import { type StreamSession } from '@/infrastructure/streaming'
import { ApiError, TransportError, parseRetryAfterSeconds } from './errors'
import { captureSofraNow } from './http'

export type ChatStreamParams = {
  userId: string
  message: string
  conversationId?: string | null
  session: StreamSession
  signal?: AbortSignal
  onUpdate?: (snapshot: AssembledStream) => void
}

async function readErrorFromResponse(res: Response): Promise<ApiError> {
  let code = 'http_error'
  let message = res.statusText || `HTTP ${res.status}`
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
      if (typeof err.code === 'string') code = err.code
      if (typeof err.message === 'string') message = err.message
    }
  } catch {
    /* ignore */
  }
  const retryAfter =
    res.status === 429 ? parseRetryAfterSeconds(res.headers.get('Retry-After')) : null
  return new ApiError(res.status, code, message, retryAfter)
}

export async function streamChat(params: ChatStreamParams): Promise<AssembledStream> {
  const { userId, message, conversationId, session, signal, onUpdate } = params

  const turn = session.beginTurn()

  const onAbort = () => {
    session.abort()
  }
  signal?.addEventListener('abort', onAbort)

  try {
    let res: Response
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
        signal,
      })
    } catch (cause) {
      session.abort()
      if (signal?.aborted) {
        return turn.getSnapshot()
      }
      throw new TransportError('Chat request failed', cause)
    }

    captureSofraNow(res)

    if (!res.ok) {
      session.abort()
      throw await readErrorFromResponse(res)
    }

    if (!res.body) {
      session.abort()
      throw new TransportError('Chat response had no body')
    }

    const reader = res.body.getReader()
    try {
      while (true) {
        if (!turn.isCurrent()) break
        const { done, value } = await reader.read()
        if (done) break
        if (value && turn.isCurrent()) {
          turn.push(value)
          const snap = turn.getSnapshot()
          if (snap.serverNow) syncServerClock(snap.serverNow)
          onUpdate?.(snap)
        }
      }
    } catch (cause) {
      if (signal?.aborted || !turn.isCurrent()) {
        return turn.finish()
      }
      throw new TransportError('Chat stream interrupted', cause)
    } finally {
      reader.releaseLock()
    }

    return turn.finish()
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}
