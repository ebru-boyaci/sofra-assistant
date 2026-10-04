import type { ConfirmationStatus } from '@/domain/confirmation'
import type { ConfirmationPromptBlock } from '@/domain/ui-spec'

export function confirmationOutcomeAnnouncement(
  status: ConfirmationStatus,
  action: ConfirmationPromptBlock['action'],
): string | null {
  switch (status) {
    case 'DONE':
      if (action === 'place_order') return 'Confirmed. Your order was placed.'
      if (action === 'cancel_order') return 'Confirmed. The order was cancelled.'
      if (action === 'add_tip') return 'Confirmed. The tip was applied.'
      return 'Confirmed.'
    case 'EXPIRED':
      return 'Confirmation expired.'
    case 'SUPERSEDED':
      return 'Confirmation replaced by a newer one.'
    case 'REJECTED':
      return 'Confirmation unavailable.'
    default:
      return null
  }
}
