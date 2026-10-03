import type { ConfirmationView } from '@/domain/confirmation'
import type {
  ConfirmationPromptBlock,
  TrustedBlock,
} from '@/domain/ui-spec'
import { BlockRenderer } from '../BlockRenderer'
import styles from './BlockList.module.css'

export type BlockListProps = {
  blocks: readonly TrustedBlock[]
  onConfirm?: (block: ConfirmationPromptBlock) => void
  onSuggestedAction?: (text: string) => void
  getConfirmView?: (token: string) => ConfirmationView | null
  confirmDisabled?: boolean
  suggestedDisabled?: boolean
}

function blockKey(block: TrustedBlock, index: number): string {
  switch (block.type) {
    case 'restaurant_card':
      return `${index}:restaurant_card:${block.restaurant_id}`
    case 'menu_item':
      return `${index}:menu_item:${block.item_id}`
    case 'order_summary':
      return `${index}:order_summary:${block.order_id}`
    case 'confirmation_prompt':
      return `${index}:confirmation_prompt:${block.confirm_token}`
    case 'error':
      return `${index}:error:${block.code}`
    default:
      return `${index}:${block.type}`
  }
}

export function BlockList({
  blocks,
  onConfirm,
  onSuggestedAction,
  getConfirmView,
  confirmDisabled,
  suggestedDisabled,
}: BlockListProps) {
  if (blocks.length === 0) return null

  return (
    <ul className={styles.list} aria-label="Assistant blocks">
      {blocks.map((block, index) => (
        <li key={blockKey(block, index)} className={styles.item}>
          <BlockRenderer
            block={block}
            onConfirm={onConfirm}
            onSuggestedAction={onSuggestedAction}
            confirmView={
              block.type === 'confirmation_prompt'
                ? (getConfirmView?.(block.confirm_token) ?? null)
                : null
            }
            confirmDisabled={confirmDisabled}
            suggestedDisabled={suggestedDisabled}
            getConfirmView={getConfirmView}
          />
        </li>
      ))}
    </ul>
  )
}
