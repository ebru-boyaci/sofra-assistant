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

function paramTotal(params: Record<string, unknown>): number | null {
  const value = params.total_try
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function settleAnnouncement(turn: AssistantTurn): string {
  if (turn.status === 'loading' || turn.status === 'streaming') return ''

  const confirm = turn.blocks.find((block) => block.type === 'confirmation_prompt')
  const gate = turn.blocks.find((block) => block.type === 'verification_gate')

  if (turn.status === 'complete') {
    if (confirm != null) {
      const action = ACTION_LABEL[confirm.action] ?? confirm.action
      const cart = turn.blocks.find((block) => block.type === 'cart_summary')
      const total = cart?.total_try ?? paramTotal(confirm.params)
      const totalPart = total != null ? `, total ${formatTry(total)}` : ''
      const remaining = remainingMsUntil(confirm.expires_at, getServerNowMs())
      const expiryPart =
        remaining != null ? `, expires in ${formatCountdown(remaining)}` : ''
      return `Reply ready. Confirmation required: ${action}${totalPart}${expiryPart}.`
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
