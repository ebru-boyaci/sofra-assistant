import {
  SUPPORTED_UI_VERSION,
  type AssembledStream,
  type StreamEvent,
} from './streamTypes'

export function createEmptyAssembly(): AssembledStream {
  // Blank page. Still arriving.
  return {
    status: 'streaming',
    version: null,
    requestId: null,
    conversationId: null,
    serverNow: null,
    blocks: [],
    audit: null,
    error: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseStreamEvent(raw: unknown): StreamEvent | null {
  // null = bad line. The page is left unchanged.
  if (!isRecord(raw)) return null
  const seq = raw.seq
  const event = raw.event
  if (typeof seq !== 'number' || !Number.isInteger(seq) || seq < 1) return null
  if (typeof event !== 'string') return null

  switch (event) {
    case 'meta': {
      if (
        typeof raw.version !== 'string' ||
        typeof raw.request_id !== 'string' ||
        typeof raw.conversation_id !== 'string' ||
        typeof raw.server_now !== 'string'
      ) {
        return null
      }
      return {
        seq,
        event: 'meta',
        version: raw.version,
        request_id: raw.request_id,
        conversation_id: raw.conversation_id,
        server_now: raw.server_now,
      }
    }
    case 'block': {
      if (typeof raw.index !== 'number' || !Number.isInteger(raw.index) || raw.index < 0) {
        return null
      }
      if (!isRecord(raw.block)) return null
      return { seq, event: 'block', index: raw.index, block: raw.block }
    }
    case 'text_delta': {
      if (typeof raw.index !== 'number' || !Number.isInteger(raw.index) || raw.index < 0) {
        return null
      }
      if (typeof raw.delta !== 'string') return null
      return { seq, event: 'text_delta', index: raw.index, delta: raw.delta }
    }
    case 'audit': {
      if (!isRecord(raw.audit)) return null
      return { seq, event: 'audit', audit: raw.audit }
    }
    case 'done':
      return { seq, event: 'done' }
    case 'error': {
      if (
        typeof raw.code !== 'string' ||
        typeof raw.message !== 'string' ||
        typeof raw.retryable !== 'boolean'
      ) {
        return null
      }
      return {
        seq,
        event: 'error',
        code: raw.code,
        message: raw.message,
        retryable: raw.retryable,
      }
    }
    default:
      return null
  }
}

export function applyStreamEvent(
  state: AssembledStream,
  raw: unknown,
  seenSeqs: Set<number>,
): AssembledStream {
  const event = parseStreamEvent(raw)
  if (!event) return state

  if (seenSeqs.has(event.seq)) return state // same seq again: keep the first
  seenSeqs.add(event.seq)

  // Already finished: later lines do not change the page.
  if (
    state.status === 'complete' ||
    state.status === 'error' ||
    state.status === 'unsupported_version'
  ) {
    return state
  }

  switch (event.event) {
    case 'meta': {
      // Only version "1" is drawn.
      if (event.version !== SUPPORTED_UI_VERSION) {
        return {
          ...state,
          status: 'unsupported_version',
          version: event.version,
          requestId: event.request_id,
          conversationId: event.conversation_id,
          serverNow: event.server_now,
        }
      }
      return {
        ...state,
        version: event.version,
        requestId: event.request_id,
        conversationId: event.conversation_id,
        serverNow: event.server_now,
      }
    }
    case 'block': {
      const blocks = state.blocks.slice()
      while (blocks.length <= event.index) blocks.push(undefined) // empty slots up to index
      blocks[event.index] = { ...event.block } // put the card on that shelf
      return { ...state, blocks }
    }
    case 'text_delta': {
      const blocks = state.blocks.slice()
      const current = blocks[event.index]
      if (!current || current.type !== 'text') return state // only text cards grow
      const markdown =
        typeof current.markdown === 'string' ? current.markdown : ''
      blocks[event.index] = { ...current, markdown: markdown + event.delta }
      return { ...state, blocks }
    }
    case 'audit':
      return { ...state, audit: event.audit }
    case 'done':
      return { ...state, status: 'complete' }
    case 'error':
      return {
        ...state,
        status: 'error',
        error: {
          code: event.code,
          message: event.message,
          retryable: event.retryable,
        },
      }
    default:
      return state
  }
}

export function markIncompleteIfNeeded(state: AssembledStream): AssembledStream {
  // Body ended and "done" never came.
  if (state.status === 'streaming') {
    return { ...state, status: 'incomplete' }
  }
  return state
}
