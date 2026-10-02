import type {
  ConfirmationPromptBlock,
  TrustedBlock,
} from '@/domain/ui-spec'
import type { ConfirmationView } from '@/domain/confirmation'
import { CartSummary } from './blocks/CartSummary'
import { ConfirmationPrompt } from './blocks/ConfirmationPrompt'
import { ErrorBlockView } from './blocks/ErrorBlock'
import { MenuItem } from './blocks/MenuItem'
import { OrderSummary } from './blocks/OrderSummary'
import { RestaurantCard } from './blocks/RestaurantCard'
import { SuggestedActions } from './blocks/SuggestedActions'
import { TextBlock } from './blocks/TextBlock'
import { VerificationGate } from './blocks/VerificationGate'
import styles from './BlockRenderer.module.css'

export type BlockRendererProps = {
  block: TrustedBlock
  onConfirm?: (block: ConfirmationPromptBlock) => void
  onSuggestedAction?: (text: string) => void
  confirmView?: ConfirmationView | null
  confirmDisabled?: boolean
  suggestedDisabled?: boolean
}

export function BlockRenderer({
  block,
  onConfirm,
  onSuggestedAction,
  confirmView = null,
  confirmDisabled,
  suggestedDisabled,
}: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return (
        <div className={styles.slot}>
          <TextBlock block={block} />
        </div>
      )
    case 'restaurant_card':
      return (
        <div className={styles.slot}>
          <RestaurantCard block={block} />
        </div>
      )
    case 'menu_item':
      return (
        <div className={styles.slot}>
          <MenuItem block={block} />
        </div>
      )
    case 'cart_summary':
      return (
        <div className={styles.slot}>
          <CartSummary block={block} />
        </div>
      )
    case 'order_summary':
      return (
        <div className={styles.slot}>
          <OrderSummary block={block} />
        </div>
      )
    case 'confirmation_prompt':
      return (
        <div className={styles.slot}>
          <ConfirmationPrompt
            block={block}
            onConfirm={onConfirm}
            view={confirmView}
            disabled={confirmDisabled}
          />
        </div>
      )
    case 'verification_gate':
      return (
        <div className={styles.slot}>
          <VerificationGate block={block} />
        </div>
      )
    case 'suggested_actions':
      return (
        <div className={styles.slot}>
          <SuggestedActions
            block={block}
            onSelect={onSuggestedAction}
            disabled={suggestedDisabled}
          />
        </div>
      )
    case 'error':
      return (
        <div className={styles.slot}>
          <ErrorBlockView block={block} />
        </div>
      )
    default: {
      const _exhaustive: never = block
      void _exhaustive
      return <div className={styles.skip} aria-hidden="true" />
    }
  }
}
