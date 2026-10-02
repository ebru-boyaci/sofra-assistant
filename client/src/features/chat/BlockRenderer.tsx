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
  getConfirmView?: (token: string) => ConfirmationView | null
}

function followUpKey(block: TrustedBlock, index: number): string {
  switch (block.type) {
    case 'restaurant_card':
      return `follow:${index}:restaurant_card:${block.restaurant_id}`
    case 'menu_item':
      return `follow:${index}:menu_item:${block.item_id}`
    case 'order_summary':
      return `follow:${index}:order_summary:${block.order_id}`
    case 'confirmation_prompt':
      return `follow:${index}:confirmation_prompt:${block.confirm_token}`
    case 'error':
      return `follow:${index}:error:${block.code}`
    default:
      return `follow:${index}:${block.type}`
  }
}

export function BlockRenderer({
  block,
  onConfirm,
  onSuggestedAction,
  confirmView = null,
  confirmDisabled,
  suggestedDisabled,
  getConfirmView,
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
    case 'confirmation_prompt': {
      const followUps = confirmView?.nextBlocks ?? null
      return (
        <div className={styles.slot}>
          <ConfirmationPrompt
            block={block}
            onConfirm={onConfirm}
            view={confirmView}
            disabled={confirmDisabled}
          />
          {followUps != null && followUps.length > 0 ? (
            <div
              className={styles.followUp}
              role="region"
              aria-label="Confirmation result"
            >
              {followUps.map((followUp, index) => (
                <BlockRenderer
                  key={followUpKey(followUp, index)}
                  block={followUp}
                  onConfirm={onConfirm}
                  onSuggestedAction={onSuggestedAction}
                  confirmView={
                    followUp.type === 'confirmation_prompt'
                      ? (getConfirmView?.(followUp.confirm_token) ?? null)
                      : null
                  }
                  confirmDisabled={confirmDisabled}
                  suggestedDisabled={suggestedDisabled}
                  getConfirmView={getConfirmView}
                />
              ))}
            </div>
          ) : null}
        </div>
      )
    }
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
