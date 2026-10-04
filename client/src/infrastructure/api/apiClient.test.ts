import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getServerNowMs,
  resetServerClockForTests,
  syncServerClock,
} from '@/domain/clock'
import { createStreamSession } from '@/infrastructure/streaming'
import {
  ApiError,
  TransportError,
  executeAction,
  getActionStatus,
  getUser,
  parseRetryAfterSeconds,
  streamChat,
} from './index'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetServerClockForTests()
})

describe('parseRetryAfterSeconds', () => {
  it('parses integer seconds', () => {
    expect(parseRetryAfterSeconds('3')).toBe(3)
  })

  it('returns null for missing/invalid', () => {
    expect(parseRetryAfterSeconds(null)).toBeNull()
    expect(parseRetryAfterSeconds('nope')).toBeNull()
  })
})

describe('server clock sync', () => {
  it('advances from sync point with local elapsed time', () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const a = getServerNowMs()
    expect(a).not.toBeNull()
    expect(Number.isFinite(a!)).toBe(true)
  })
})

describe('apiJson / getUser', () => {
  it('captures X-Sofra-Now and returns JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: 'u_ok',
            display_name: 'Deniz',
            wallet_balance_try: 800,
            payment_method: true,
            age_verified: true,
            address: 'Kadıköy',
            district: 'Kadıköy',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Sofra-Now': '2026-08-20T09:00:04.000Z',
            },
          },
        ),
      ),
    )

    const user = await getUser('u_ok')
    expect(user.wallet_balance_try).toBe(800)
    expect(getServerNowMs()).not.toBeNull()
  })

  it('throws ApiError with Retry-After on 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: 'rate_limited', message: 'slow down' } }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3',
            'X-Sofra-Now': '2026-08-20T09:00:00.000Z',
          },
        }),
      ),
    )

    await expect(getUser('u_ok')).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
      code: 'rate_limited',
      retryAfterSeconds: 3,
    } satisfies Partial<ApiError>)
  })

  it('throws ApiError on 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: 'internal', message: 'boom' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(getUser('u_ok')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('executeAction', () => {
  it('returns body even on 409 (ui_spec rejection)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            version: '1',
            blocks: [{ type: 'error', code: 'token_used', message: 'already' }],
            audit: { decision: 'refused' },
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'X-Sofra-Now': '2026-08-20T09:00:00.000Z',
            },
          },
        ),
      ),
    )

    const result = await executeAction({
      user_id: 'u_ok',
      action: 'place_order',
      params: {},
      confirm_token: 'ct_x.y',
    })
    expect(result.httpStatus).toBe(409)
    expect(result.body).toMatchObject({ version: '1' })
  })

  it('throws TransportError when body is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    )

    await expect(
      executeAction({
        user_id: 'u_ok',
        action: 'place_order',
        params: {},
        confirm_token: 'ct_x.y',
      }),
    ).rejects.toBeInstanceOf(TransportError)
  })
})

describe('getActionStatus', () => {
  it('GETs confirm_token query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      expect(url).toContain('/api/actions/status?')
      expect(url).toContain('confirm_token=ct_abc')
      return new Response(JSON.stringify({ state: 'live', action: 'place_order' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const status = await getActionStatus('ct_abc')
    expect(status.state).toBe('live')
  })
})

describe('streamChat', () => {
  function ndjsonStream(events: unknown[]): ReadableStream<Uint8Array> {
    const enc = new TextEncoder()
    const body = events.map((e) => JSON.stringify(e)).join('\n') + '\n'
    return new ReadableStream({
      start(controller) {
        const bytes = enc.encode(body)
        const mid = Math.floor(bytes.length / 2)
        controller.enqueue(bytes.subarray(0, mid))
        controller.enqueue(bytes.subarray(mid))
        controller.close()
      },
    })
  }

  function slowStream(lines: unknown[], advance: () => void): ReadableStream<Uint8Array> {
    const enc = new TextEncoder()
    let i = 0
    return new ReadableStream(
      {
        pull(controller) {
          if (i > 0) advance()
          if (i >= lines.length) {
            controller.close()
            return
          }
          controller.enqueue(enc.encode(JSON.stringify(lines[i]) + '\n'))
          i += 1
        },
      },
      { highWaterMark: 0 },
    )
  }

  const slowTurn = [
    {
      seq: 1,
      event: 'meta',
      version: '1',
      request_id: 'rq_slow',
      conversation_id: 'cv_slow',
      server_now: '2026-08-20T09:00:00.000Z',
    },
    { seq: 2, event: 'block', index: 0, block: { type: 'text', markdown: '' } },
    { seq: 3, event: 'text_delta', index: 0, delta: 'Hi' },
    { seq: 4, event: 'done' },
  ]

  it('a slow stream does not drag the server clock back to meta.server_now', async () => {
    let perfMs = 0
    vi.spyOn(performance, 'now').mockImplementation(() => perfMs)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(slowStream(slowTurn, () => (perfMs += 1000)), {
          status: 200,
          headers: {
            'Content-Type': 'application/x-ndjson',
            'X-Sofra-Now': '2026-08-20T09:00:00.000Z',
          },
        }),
      ),
    )

    await streamChat({ userId: 'u_ok', message: 'x', session: createStreamSession() })

    expect(perfMs).toBe(4000)
    expect(getServerNowMs()).toBe(Date.parse('2026-08-20T09:00:04.000Z'))
  })

  it('without X-Sofra-Now, meta.server_now is used once, when it arrives', async () => {
    let perfMs = 0
    vi.spyOn(performance, 'now').mockImplementation(() => perfMs)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(slowStream(slowTurn, () => (perfMs += 1000)), {
          status: 200,
          headers: { 'Content-Type': 'application/x-ndjson' },
        }),
      ),
    )

    await streamChat({ userId: 'u_ok', message: 'x', session: createStreamSession() })

    expect(getServerNowMs()).toBe(Date.parse('2026-08-20T09:00:04.000Z'))
  })

  it('streams NDJSON into the session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as {
          user_id: string
          message: string
          conversation_id?: string
        }
        expect(body.user_id).toBe('u_ok')
        expect(body.message).toBe('What is in my cart?')
        expect(body.conversation_id).toBeUndefined()

        return new Response(
          ndjsonStream([
            {
              seq: 1,
              event: 'meta',
              version: '1',
              request_id: 'rq_1',
              conversation_id: 'cv_1',
              server_now: '2026-08-20T09:00:10.000Z',
            },
            {
              seq: 2,
              event: 'block',
              index: 0,
              block: { type: 'text', markdown: '' },
            },
            { seq: 3, event: 'text_delta', index: 0, delta: 'Hi' },
            { seq: 4, event: 'audit', audit: { decision: 'answered' } },
            { seq: 5, event: 'done' },
          ]),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/x-ndjson',
              'X-Sofra-Now': '2026-08-20T09:00:09.000Z',
            },
          },
        )
      }),
    )

    const session = createStreamSession()
    const updates: string[] = []
    const result = await streamChat({
      userId: 'u_ok',
      message: 'What is in my cart?',
      session,
      onUpdate: (s) => {
        if (s.blocks[0] && typeof s.blocks[0].markdown === 'string') {
          updates.push(s.blocks[0].markdown)
        }
      },
    })

    expect(result.status).toBe('complete')
    expect(result.conversationId).toBe('cv_1')
    expect(result.blocks[0]).toMatchObject({ markdown: 'Hi' })
    expect(getServerNowMs()).not.toBeNull()
    expect(updates.at(-1)).toBe('Hi')
  })

  it('sends conversation_id when provided', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { conversation_id?: string }
      expect(body.conversation_id).toBe('cv_keep')
      return new Response(
        ndjsonStream([
          {
            seq: 1,
            event: 'meta',
            version: '1',
            request_id: 'rq',
            conversation_id: 'cv_keep',
            server_now: '2026-08-20T09:00:00.000Z',
          },
          { seq: 2, event: 'done' },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await streamChat({
      userId: 'u_ok',
      message: 'follow up',
      conversationId: 'cv_keep',
      session: createStreamSession(),
    })
  })

  it('throws ApiError on pre-stream 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: 'rate_limited', message: 'wait' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '3' },
        }),
      ),
    )

    await expect(
      streamChat({
        userId: 'u_ok',
        message: 'x',
        session: createStreamSession(),
      }),
    ).rejects.toMatchObject({ status: 429, retryAfterSeconds: 3 })
  })

  it('abort signal invalidates the turn (no leak into next beginTurn)', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal
        return new Response(
          new ReadableStream({
            async start(controller) {
              const enc = new TextEncoder()
              controller.enqueue(
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
              await gate
              if (signal?.aborted) {
                controller.error(new DOMException('Aborted', 'AbortError'))
                return
              }
              controller.close()
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } },
        )
      }),
    )

    const session = createStreamSession()
    const ac = new AbortController()
    const pending = streamChat({
      userId: 'u_ok',
      message: 'slow',
      session,
      signal: ac.signal,
    })

    ac.abort()
    release()
    await pending

    const next = session.beginTurn()
    next.push(
      new TextEncoder().encode(
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
    const snap = next.finish()
    expect(snap.requestId).toBe('rq_new')
    expect(snap.conversationId).toBe('cv_new')
  })
})
