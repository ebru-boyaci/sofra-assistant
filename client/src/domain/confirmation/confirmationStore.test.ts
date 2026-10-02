import {
  getServerNowMs,
  resetServerClockForTests,
  syncServerClock,
} from '@/domain/clock'
import {
  ConfirmationPromptSchema,
  type ConfirmationPromptBlock,
} from '@/domain/ui-spec'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createConfirmationStore, type ConfirmationStoreDeps } from './confirmationStore'

function prompt(
  overrides: Partial<ConfirmationPromptBlock> = {},
): ConfirmationPromptBlock {
  return {
    type: 'confirmation_prompt',
    action: 'place_order',
    summary: 'Place order — 390 TL',
    params: { restaurant_id: 'rst_04', items: [{ item_id: 'itm_1', qty: 2 }] },
    confirm_token: 'ct_live.one',
    expires_at: '2026-08-20T09:05:00.000Z',
    ...overrides,
  }
}

function makeStore(overrides: {
  execute?: ConfirmationStoreDeps['execute']
  getStatus?: ConfirmationStoreDeps['getStatus']
} = {}) {
  const execute: ConfirmationStoreDeps['execute'] =
    overrides.execute ??
    (async () => ({
      httpStatus: 200,
      body: {
        version: '1',
        blocks: [{ type: 'text', markdown: 'Order placed' }],
        audit: { decision: 'answered' },
      },
    }))
  const getStatus: ConfirmationStoreDeps['getStatus'] =
    overrides.getStatus ?? (async () => ({ state: 'live' as const }))

  const executeSpy = vi.fn(execute)
  const getStatusSpy = vi.fn(getStatus)

  const store = createConfirmationStore({
    getServerNowMs,
    execute: executeSpy,
    getStatus: getStatusSpy,
    isTransportError: (error) =>
      error instanceof Error && error.name === 'TransportError',
  })

  return { store, execute: executeSpy, getStatus: getStatusSpy }
}

afterEach(() => {
  resetServerClockForTests()
  vi.restoreAllMocks()
})

describe('confirmation store', () => {
  it('double-click / parallel confirm → one execute request', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const execute = vi.fn(async () => {
      await gate
      return {
        httpStatus: 200,
        body: {
          version: '1',
          blocks: [{ type: 'text', markdown: 'ok' }],
          audit: { decision: 'answered' },
        },
      }
    })
    const { store } = makeStore({ execute })
    store.register('u_ok', prompt())

    const a = store.confirm('ct_live.one')
    const b = store.confirm('ct_live.one')
    const c = store.confirm('ct_live.one')

    expect(store.get('ct_live.one')?.status).toBe('CONFIRMING')
    release()
    await Promise.all([a, b, c])

    expect(execute).toHaveBeenCalledTimes(1)
    expect(store.get('ct_live.one')?.status).toBe('DONE')
  })

  it('past expires_at on server clock → cannot confirm', async () => {
    syncServerClock('2026-08-20T09:06:00.000Z')
    const { store, execute } = makeStore()
    store.register('u_ok', prompt())

    expect(store.get('ct_live.one')?.status).toBe('EXPIRED')
    await store.confirm('ct_live.one')
    expect(execute).not.toHaveBeenCalled()
    expect(store.viewFor('ct_live.one')?.canConfirm).toBe(false)
  })

  it('newer prompt for same action supersedes older', () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const { store } = makeStore()
    store.register('u_ok', prompt({ confirm_token: 'ct_old.tok' }))
    store.register(
      'u_ok',
      prompt({
        confirm_token: 'ct_new.tok',
        summary: 'Updated order',
      }),
    )

    expect(store.get('ct_old.tok')?.status).toBe('SUPERSEDED')
    expect(store.get('ct_new.tok')?.status).toBe('LIVE')
    expect(store.viewFor('ct_old.tok')?.canConfirm).toBe(false)
    expect(store.viewFor('ct_new.tok')?.canConfirm).toBe(true)
  })

  it('dropped execute → RECONCILING → status used → DONE (no second execute)', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const transport = Object.assign(new Error('socket destroyed'), {
      name: 'TransportError',
    })
    const execute = vi.fn(async () => {
      throw transport
    })
    const getStatus = vi.fn(async () => ({
      state: 'used' as const,
      executed_at: '2026-08-20T09:00:01.000Z',
      result: {
        version: '1',
        blocks: [{ type: 'text', markdown: 'Placed while offline' }],
        audit: { decision: 'answered' },
      },
    }))
    const { store } = makeStore({ execute, getStatus })
    store.register('u_ok', prompt())

    await store.confirm('ct_live.one')

    expect(execute).toHaveBeenCalledTimes(1)
    expect(getStatus).toHaveBeenCalledTimes(1)
    expect(store.get('ct_live.one')?.status).toBe('DONE')

    await store.confirm('ct_live.one')
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('invalid prompt → no Confirm (never registered as actionable)', () => {
    const raw = {
      type: 'confirmation_prompt',
      action: 'place_order',
      summary: 'bait',
      params: {},
      confirm_token: 'ct_bait.real',
      // expires_at missing
    }
    const parsed = ConfirmationPromptSchema.safeParse(raw)
    expect(parsed.success).toBe(false)

    syncServerClock('2026-08-20T09:00:00.000Z')
    const { store, execute } = makeStore()
    // Store only accepts typed prompts — invalid never reaches register.
    expect(store.get('ct_bait.real')).toBeUndefined()
    expect(store.viewFor('ct_bait.real')).toBeNull()
    void execute
  })

  it('sends exact parsed params unmodified', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const params = { restaurant_id: 'rst_04', tip_try: 20 }
    const { store, execute } = makeStore()
    const block = prompt({ params, confirm_token: 'ct_params.one' })
    store.register('u_ok', block)

    await store.confirm('ct_params.one')

    expect(execute).toHaveBeenCalledWith({
      user_id: 'u_ok',
      action: 'place_order',
      params,
      confirm_token: 'ct_params.one',
    })
    expect(execute.mock.calls[0][0].params).toBe(params)
  })

  it('user switch clears previous user live confirms', () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const { store } = makeStore()
    store.register('u_ok', prompt({ confirm_token: 'ct_u1' }))
    store.clearUser('u_ok')
    expect(store.get('ct_u1')?.status).toBe('SUPERSEDED')
    expect(store.viewFor('ct_u1')?.canConfirm).toBe(false)
  })

  it('409 token_superseded → SUPERSEDED and keeps next blocks', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const execute = vi.fn(async () => ({
      httpStatus: 409,
      body: {
        version: '1',
        blocks: [
          {
            type: 'error',
            code: 'token_superseded',
            message: 'A newer confirmation replaced this one.',
          },
          {
            type: 'confirmation_prompt',
            action: 'place_order',
            summary: 'Fresh prompt',
            params: { restaurant_id: 'rst_04' },
            confirm_token: 'ct_fresh.tok',
            expires_at: '2026-08-20T09:10:00.000Z',
          },
        ],
        audit: { decision: 'needs_confirmation' },
      },
    }))
    const { store } = makeStore({ execute })
    store.register('u_ok', prompt())

    await store.confirm('ct_live.one')

    const entry = store.get('ct_live.one')
    expect(entry?.status).toBe('SUPERSEDED')
    expect(entry?.nextBlocks?.some((b) => b.type === 'confirmation_prompt')).toBe(
      true,
    )
  })

  it('410 token_expired → EXPIRED', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const execute = vi.fn(async () => ({
      httpStatus: 410,
      body: {
        version: '1',
        blocks: [
          {
            type: 'error',
            code: 'token_expired',
            message: 'This confirmation expired.',
          },
        ],
        audit: { decision: 'refused' },
      },
    }))
    const { store } = makeStore({ execute })
    store.register('u_ok', prompt())
    await store.confirm('ct_live.one')
    expect(store.get('ct_live.one')?.status).toBe('EXPIRED')
  })

  it('422 gate_closed → REJECTED with gate block', async () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    const execute = vi.fn(async () => ({
      httpStatus: 422,
      body: {
        version: '1',
        blocks: [
          {
            type: 'verification_gate',
            requirement: 'sufficient_funds',
            reason: 'Not enough balance',
            cta: 'Top up',
          },
        ],
        audit: { decision: 'blocked', reason: 'sufficient_funds' },
      },
    }))
    const { store } = makeStore({ execute })
    store.register('u_ok', prompt())
    await store.confirm('ct_live.one')
    const entry = store.get('ct_live.one')
    expect(entry?.status).toBe('REJECTED')
    expect(entry?.nextBlocks?.[0]?.type).toBe('verification_gate')
  })
})
