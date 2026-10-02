import { describe, expect, it } from 'vitest'
import {
  applyStreamEvent,
  createEmptyAssembly,
  createNdjsonParser,
  createStreamSession,
  markIncompleteIfNeeded,
} from './index'

const enc = new TextEncoder()

function feedLines(
  lines: unknown[],
  options?: { splitEvery?: number },
): ReturnType<typeof createEmptyAssembly> {
  const seen = new Set<number>()
  let state = createEmptyAssembly()
  const parser = createNdjsonParser((value) => {
    state = applyStreamEvent(state, value, seen)
  })

  const body = lines.map((l) => JSON.stringify(l)).join('\n') + '\n'
  const bytes = enc.encode(body)
  const n = options?.splitEvery ?? bytes.length
  for (let i = 0; i < bytes.length; i += n) {
    parser.push(bytes.subarray(i, Math.min(i + n, bytes.length)))
  }
  parser.end()
  return markIncompleteIfNeeded(state)
}

describe('createNdjsonParser', () => {
  it('decodes a UTF-8 character split across two chunks (Kadıköy)', () => {
    const full = enc.encode('Kadıköy')
    // Cut inside a multi-byte letter (ı or ö).
    let cut = -1
    for (let i = 0; i < full.length; i++) {
      if (full[i] >= 0xc0) {
        cut = i + 1
        break
      }
    }
    expect(cut).toBeGreaterThan(0)

    let text = ''
    const decoder = new TextDecoder('utf-8')
    text += decoder.decode(full.subarray(0, cut), { stream: true })
    text += decoder.decode(full.subarray(cut), { stream: true })
    text += decoder.decode()
    expect(text).toBe('Kadıköy')

    // Same check through the parser, inside a text_delta.
    const prefix = '{"seq":3,"event":"text_delta","index":0,"delta":"'
    const suffix = '"}\n'
    const lineStart = enc.encode(prefix)
    const lineEnd = enc.encode(suffix)

    const seen = new Set<number>()
    let state = createEmptyAssembly()
    state = applyStreamEvent(
      state,
      {
        seq: 1,
        event: 'meta',
        version: '1',
        request_id: 'rq',
        conversation_id: 'cv',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      seen,
    )
    // Empty text card on shelf 0, so the delta has somewhere to land.
    state = applyStreamEvent(
      state,
      { seq: 2, event: 'block', index: 0, block: { type: 'text', markdown: '' } },
      seen,
    )

    const parser = createNdjsonParser((value) => {
      state = applyStreamEvent(state, value, seen)
    })

    // First chunk ends in the middle of "ı".
    const deltaBytes = enc.encode('Kadıköy')
    const mid = (() => {
      for (let i = 0; i < deltaBytes.length; i++) {
        if (deltaBytes[i] >= 0xc0) return i + 1
      }
      return 1
    })()

    const part1 = new Uint8Array(lineStart.length + mid)
    part1.set(lineStart, 0)
    part1.set(deltaBytes.subarray(0, mid), lineStart.length)

    const part2 = new Uint8Array(deltaBytes.length - mid + lineEnd.length)
    part2.set(deltaBytes.subarray(mid), 0)
    part2.set(lineEnd, deltaBytes.length - mid)

    parser.push(part1)
    parser.push(part2)
    parser.end()

    expect(state.blocks[0]).toMatchObject({
      type: 'text',
      markdown: 'Kadıköy',
    })
  })

  it('parses a JSON line split across two chunks once', () => {
    const events: unknown[] = []
    const parser = createNdjsonParser((v) => events.push(v))
    const line =
      '{"seq":1,"event":"meta","version":"1","request_id":"rq","conversation_id":"cv","server_now":"2026-08-20T09:00:00.000Z"}\n'
    const bytes = enc.encode(line)
    const mid = Math.floor(bytes.length / 2)
    parser.push(bytes.subarray(0, mid))
    expect(events).toHaveLength(0)
    parser.push(bytes.subarray(mid))
    parser.end()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ event: 'meta', seq: 1 })
  })
})

describe('applyStreamEvent', () => {
  it('applies a duplicated seq only once', () => {
    const seen = new Set<number>()
    let state = createEmptyAssembly()
    const block = {
      seq: 2,
      event: 'block' as const,
      index: 0,
      block: { type: 'text', markdown: '' },
    }
    state = applyStreamEvent(
      state,
      {
        seq: 1,
        event: 'meta',
        version: '1',
        request_id: 'rq',
        conversation_id: 'cv',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      seen,
    )
    state = applyStreamEvent(state, block, seen)
    state = applyStreamEvent(
      state,
      { seq: 3, event: 'text_delta', index: 0, delta: 'Hi' },
      seen,
    )
    state = applyStreamEvent(
      state,
      { seq: 3, event: 'text_delta', index: 0, delta: 'Hi' },
      seen,
    )
    expect(state.blocks[0]).toMatchObject({ markdown: 'Hi' })
  })

  it('marks incomplete when the body ends without done', () => {
    const state = feedLines([
      {
        seq: 1,
        event: 'meta',
        version: '1',
        request_id: 'rq',
        conversation_id: 'cv',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      {
        seq: 2,
        event: 'block',
        index: 0,
        block: { type: 'text', markdown: '' },
      },
      { seq: 3, event: 'text_delta', index: 0, delta: 'Partial' },
    ])
    expect(state.status).toBe('incomplete')
    expect(state.blocks[0]).toMatchObject({ markdown: 'Partial' })
  })

  it('ends on error and exposes retryable', () => {
    const state = feedLines([
      {
        seq: 1,
        event: 'meta',
        version: '1',
        request_id: 'rq',
        conversation_id: 'cv',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      {
        seq: 2,
        event: 'error',
        code: 'upstream_timeout',
        message: 'took too long',
        retryable: true,
      },
    ])
    expect(state.status).toBe('error')
    expect(state.error).toEqual({
      code: 'upstream_timeout',
      message: 'took too long',
      retryable: true,
    })
  })

  it('refuses unsupported version (not "1")', () => {
    const state = feedLines([
      {
        seq: 1,
        event: 'meta',
        version: '2',
        request_id: 'rq',
        conversation_id: 'cv',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      {
        seq: 2,
        event: 'block',
        index: 0,
        block: { type: 'text', markdown: 'nope' },
      },
    ])
    expect(state.status).toBe('unsupported_version')
    expect(state.blocks).toHaveLength(0)
  })

  it('assembles meta → block → deltas → audit → done', () => {
    const state = feedLines([
      {
        seq: 1,
        event: 'meta',
        version: '1',
        request_id: 'rq_1',
        conversation_id: 'cv_1',
        server_now: '2026-08-20T09:00:00.000Z',
      },
      {
        seq: 2,
        event: 'block',
        index: 0,
        block: { type: 'text', markdown: '' },
      },
      { seq: 3, event: 'text_delta', index: 0, delta: 'Hello ' },
      { seq: 4, event: 'text_delta', index: 0, delta: 'Kadıköy' },
      {
        seq: 5,
        event: 'audit',
        audit: { decision: 'answered', reason: 'ok' },
      },
      { seq: 6, event: 'done' },
    ])
    expect(state.status).toBe('complete')
    expect(state.conversationId).toBe('cv_1')
    expect(state.blocks[0]).toMatchObject({
      type: 'text',
      markdown: 'Hello Kadıköy',
    })
    expect(state.audit).toMatchObject({ decision: 'answered' })
  })
})

describe('createStreamSession generation guard', () => {
  it('does not let an aborted stream paint into a later turn', () => {
    const session = createStreamSession()
    const first = session.beginTurn()

    first.push(
      enc.encode(
        JSON.stringify({
          seq: 1,
          event: 'meta',
          version: '1',
          request_id: 'rq_old',
          conversation_id: 'cv_old',
          server_now: '2026-08-20T09:00:00.000Z',
        }) + '\n',
      ),
    )

    const second = session.beginTurn()
    expect(first.isCurrent()).toBe(false)

    // Old turn's late chunk must not land on the new page.
    first.push(
      enc.encode(
        JSON.stringify({
          seq: 2,
          event: 'block',
          index: 0,
          block: { type: 'text', markdown: 'LEAK' },
        }) + '\n',
      ),
    )

    second.push(
      enc.encode(
        JSON.stringify({
          seq: 1,
          event: 'meta',
          version: '1',
          request_id: 'rq_new',
          conversation_id: 'cv_new',
          server_now: '2026-08-20T09:00:01.000Z',
        }) + '\n',
      ),
    )
    const result = second.finish()

    expect(result.requestId).toBe('rq_new')
    expect(result.conversationId).toBe('cv_new')
    expect(result.blocks.some((b) => b?.markdown === 'LEAK')).toBe(false)
  })

  it('abort() invalidates the in-flight turn', () => {
    const session = createStreamSession()
    const turn = session.beginTurn()
    session.abort()
    turn.push(
      enc.encode(
        JSON.stringify({
          seq: 1,
          event: 'meta',
          version: '1',
          request_id: 'rq',
          conversation_id: 'cv',
          server_now: '2026-08-20T09:00:00.000Z',
        }) + '\n',
      ),
    )
    expect(turn.isCurrent()).toBe(false)
    expect(turn.getSnapshot().requestId).toBeNull()
  })
})
