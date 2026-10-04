import {
  formatCountdown,
  getServerNowMs,
  remainingMsUntil,
} from '@/domain/clock'
import { formatTry } from '@/shared/formatMoney'
import type { AssistantTurn } from './chatTypes'

const ACTION_LABEL: Record<string, string> = {
  place_order: 'place order',
  cancel_order: 'cancel order',
  add_tip: 'add tip',
}

function paramNumber(
  params: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const key of keys) {
    const value = params[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
}

function moneyPart(
  action: string,
  params: Record<string, unknown>,
  cartTotal: number | undefined,
): string {
  if (action === 'add_tip') {
    const tip = paramNumber(params, ['amount_try', 'tip_try', 'total_try'])
    return tip != null ? `, tip ${formatTry(tip)}` : ''
  }
  const total = cartTotal ?? paramNumber(params, ['total_try'])
  return total != null ? `, total ${formatTry(total)}` : ''
}

export function settleAnnouncement(turn: AssistantTurn): string {
  if (turn.status === 'loading' || turn.status === 'streaming') return ''

  const confirm = turn.blocks.find((block) => block.type === 'confirmation_prompt')
  const gate = turn.blocks.find((block) => block.type === 'verification_gate')

  if (turn.status === 'complete') {
    if (confirm != null) {
      const action = ACTION_LABEL[confirm.action] ?? confirm.action
      const cart = turn.blocks.find((block) => block.type === 'cart_summary')
      const amountPart = moneyPart(confirm.action, confirm.params, cart?.total_try)
      const remaining = remainingMsUntil(confirm.expires_at, getServerNowMs())
      const expiryPart =
        remaining != null ? `, expires in ${formatCountdown(remaining)}` : ''
      return `Reply ready. Confirmation required: ${action}${amountPart}${expiryPart}.`
    }
    if (gate != null) {
      return `Reply ready. Action blocked — nothing executed. ${gate.requirement}.`
    }
    return 'Reply ready.'
  }

  if (turn.status === 'incomplete') {
    return 'Reply incomplete. You can retry.'
  }
  if (turn.status === 'stopped') {
    return 'Reply stopped.'
  }
  if (turn.status === 'rate_limited') {
    return 'Rate limited. Wait before sending again.'
  }
  if (turn.status === 'error_retryable') {
    return 'Reply failed. You can retry.'
  }
  if (turn.status === 'error_final' || turn.status === 'unsupported_version') {
    return 'Reply failed.'
  }

  return 'Reply ready.'
}
