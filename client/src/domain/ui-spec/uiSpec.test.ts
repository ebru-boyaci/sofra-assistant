import { describe, expect, it } from 'vitest'
import {
  actionableConfirmations,
  isActionableConfirmation,
  parseBlockList,
  parseUiSpecDocument,
} from './index'

const validConfirm = {
  type: 'confirmation_prompt',
  action: 'place_order',
  summary: 'Order 2 cheeseburgers. Total 390 TL.',
  params: {
    restaurant_id: 'rst_04',
    items: [{ item_id: 'itm_x', qty: 2 }],
    total_try: 390,
  },
  confirm_token: 'ct_abc.sig',
  expires_at: '2026-08-20T09:05:00.000Z',
}

describe('parseBlockList', () => {
  it('accepts a valid confirmation as actionable', () => {
    const result = parseBlockList([validConfirm])
    expect(result.failures).toHaveLength(0)
    expect(result.rejectedConfirmation).toBe(false)
    expect(result.blocks).toHaveLength(1)
    expect(isActionableConfirmation(result.blocks[0]!)).toBe(true)
    expect(actionableConfirmations(result.blocks)).toHaveLength(1)
  })

  it('malformed confirmation (missing expires_at) → no actionable Confirm', () => {
    const bait = {
      type: 'confirmation_prompt',
      action: 'place_order',
      summary: 'Order 2 cheeseburgers',
      params: { restaurant_id: 'rst_04', items: [], total_try: 390 },
      confirm_token: 'ct_bait.real_token',
      // expires_at intentionally omitted — chaos malformed_confirmation
    }

    const result = parseBlockList([
      { type: 'text', markdown: 'Here is your order' },
      bait,
      { type: 'suggested_actions', chips: ['Show cart'] },
    ])

    expect(result.rejectedConfirmation).toBe(true)
    expect(actionableConfirmations(result.blocks)).toHaveLength(0)
    expect(result.blocks.map((b) => b.type)).toEqual(['text', 'suggested_actions'])
    expect(result.failures.some((f) => f.type === 'confirmation_prompt')).toBe(true)
    expect(
      result.failures.find((f) => f.type === 'confirmation_prompt')?.message,
    ).toMatch(/Confirm control must not be rendered/)
  })

  it('skips unknown block types and keeps the rest', () => {
    const result = parseBlockList([
      { type: 'text', markdown: 'Hi' },
      { type: 'map_view', lat: 1, lng: 2 },
      {
        type: 'restaurant_card',
        restaurant_id: 'rst_01',
        name: 'Napoli Fırın',
      },
    ])

    expect(result.blocks.map((b) => b.type)).toEqual(['text', 'restaurant_card'])
    expect(result.failures).toEqual([
      expect.objectContaining({ kind: 'unknown_type', type: 'map_view' }),
    ])
  })

  it('does not render an invalid known block (e.g. price_try as string)', () => {
    const result = parseBlockList([
      {
        type: 'menu_item',
        item_id: 'itm_1',
        name: 'Burger',
        price_try: '195 TL',
        available: true,
        age_restricted: false,
      },
      {
        type: 'menu_item',
        item_id: 'itm_2',
        name: 'Fries',
        price_try: 45,
        available: true,
        age_restricted: false,
      },
    ])

    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0]).toMatchObject({ item_id: 'itm_2', price_try: 45 })
    expect(result.failures[0]).toMatchObject({
      kind: 'invalid_block',
      type: 'menu_item',
    })
  })

  it('rejects extra fields on known blocks (strict)', () => {
    const result = parseBlockList([
      { type: 'text', markdown: 'x', unexpected: true },
    ])
    expect(result.blocks).toHaveLength(0)
    expect(result.failures[0]?.kind).toBe('invalid_block')
  })
})

describe('parseUiSpecDocument', () => {
  it('parses a valid document shell + blocks + audit', () => {
    const result = parseUiSpecDocument({
      version: '1',
      blocks: [
        { type: 'text', markdown: 'Done' },
        {
          type: 'order_summary',
          order_id: 'u_ok_o10',
          status: 'received',
          total_try: 390,
          restaurant: 'Burger Stop',
        },
      ],
      audit: {
        decision: 'answered',
        reason: 'confirmed by user',
        intent: 'place_order',
        tools_called: ['place_order'],
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.audit.decision).toBe('answered')
    expect(result.blocks).toHaveLength(2)
    expect(result.failures).toHaveLength(0)
  })

  it('fails the document when version/audit shell is invalid', () => {
    const result = parseUiSpecDocument({
      version: '2',
      blocks: [{ type: 'text', markdown: 'x' }],
      audit: { decision: 'answered' },
    })
    expect(result.ok).toBe(false)
  })

  it('accepts unknown audit keys (open in the contract) and strips them', () => {
    const result = parseUiSpecDocument({
      version: '1',
      blocks: [{ type: 'text', markdown: 'ok' }],
      audit: { decision: 'answered', latency_ms: 42 },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.audit).toEqual({ decision: 'answered' })
  })

  it('still fails the document when a typed audit field is wrong', () => {
    const result = parseUiSpecDocument({
      version: '1',
      blocks: [{ type: 'text', markdown: 'ok' }],
      audit: { decision: 'maybe' },
    })
    expect(result.ok).toBe(false)
  })

  it('keeps audit kb_doc_ids when present', () => {
    const result = parseUiSpecDocument({
      version: '1',
      blocks: [{ type: 'text', markdown: 'fee' }],
      audit: {
        decision: 'answered',
        reason: 'data-backed',
        kb_doc_ids: ['pol_delivery_fee_v2', 'ann_fee_current'],
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.audit.kb_doc_ids).toEqual([
      'pol_delivery_fee_v2',
      'ann_fee_current',
    ])
  })

  it('isolates invalid confirmation inside an otherwise valid document', () => {
    const result = parseUiSpecDocument({
      version: '1',
      blocks: [
        { type: 'cart_summary', items: [{ name: 'X', qty: 1, price_try: 10 }], total_try: 10 },
        {
          type: 'confirmation_prompt',
          action: 'place_order',
          summary: 'Pay',
          params: { total_try: 10 },
          confirm_token: 'ct_x.y',
        },
      ],
      audit: { decision: 'needs_confirmation' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rejectedConfirmation).toBe(true)
    expect(actionableConfirmations(result.blocks)).toHaveLength(0)
    expect(result.blocks.map((b) => b.type)).toEqual(['cart_summary'])
  })
})

describe('verification_gate + helpers', () => {
  it('accepts a gate and never confuses it with confirmation data', () => {
    const result = parseBlockList([
      {
        type: 'verification_gate',
        requirement: 'sufficient_funds',
        reason: 'Not enough wallet',
        cta: 'Top up',
      },
    ])
    expect(result.blocks[0]?.type).toBe('verification_gate')
    expect(actionableConfirmations(result.blocks)).toHaveLength(0)
  })
})
