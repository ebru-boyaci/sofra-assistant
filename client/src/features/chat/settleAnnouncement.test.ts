import { resetServerClockForTests, syncServerClock } from '@/domain/clock'
import { afterEach, describe, expect, it } from 'vitest'
import type { AssistantTurn } from './chatTypes'
import { settleAnnouncement } from './settleAnnouncement'

afterEach(() => {
  resetServerClockForTests()
})

function turn(
  partial: Partial<AssistantTurn> &
    Pick<AssistantTurn, 'status' | 'blocks'>,
): AssistantTurn {
  return {
    id: 'a1',
    role: 'assistant',
    failures: [],
    audit: null,
    rejectedConfirmation: false,
    message: null,
    retryable: false,
    retryAfterSeconds: null,
    requestId: null,
    ...partial,
  }
}

describe('settleAnnouncement', () => {
  it('stays quiet while streaming', () => {
    expect(
      settleAnnouncement(turn({ status: 'streaming', blocks: [] })),
    ).toBe('')
  })

  it('names a place-order confirmation with total and expiry once', () => {
    syncServerClock('2026-08-20T11:55:00+03:00')
    expect(
      settleAnnouncement(
        turn({
          status: 'complete',
          blocks: [
            {
              type: 'cart_summary',
              restaurant_id: 'r1',
              items: [{ name: 'Burger', qty: 2, price_try: 195 }],
              subtotal_try: 390,
              delivery_fee_try: 0,
              total_try: 390,
              min_order_try: 100,
              meets_minimum: true,
            },
            {
              type: 'confirmation_prompt',
              action: 'place_order',
              summary: 'Order 2',
              confirm_token: 'tok',
              expires_at: '2026-08-20T12:00:00+03:00',
              params: { total_try: 390 },
            },
          ],
        }),
      ),
    ).toBe(
      'Reply ready. Confirmation required: place order, total ₺390, expires in 5:00.',
    )
  })

  it('names a tip confirmation with amount_try, not the order total', () => {
    syncServerClock('2026-08-20T11:55:00+03:00')
    expect(
      settleAnnouncement(
        turn({
          status: 'complete',
          blocks: [
            {
              type: 'order_summary',
              order_id: 'u_ok_o9',
              restaurant: 'Burger Stop',
              total_try: 390,
              status: 'delivered',
            },
            {
              type: 'confirmation_prompt',
              action: 'add_tip',
              summary: 'Tip 20 TL',
              confirm_token: 'tok_tip',
              expires_at: '2026-08-20T12:00:00+03:00',
              params: { order_id: 'u_ok_o9', amount_try: 20 },
            },
          ],
        }),
      ),
    ).toBe(
      'Reply ready. Confirmation required: add tip, tip ₺20, expires in 5:00.',
    )
  })

  it('names a verification gate', () => {
    expect(
      settleAnnouncement(
        turn({
          status: 'complete',
          blocks: [
            {
              type: 'verification_gate',
              requirement: 'sufficient_funds',
              reason: 'Not enough wallet',
              cta: 'Add funds',
            },
          ],
        }),
      ),
    ).toBe(
      'Reply ready. Action blocked — nothing executed. sufficient_funds.',
    )
  })
})
