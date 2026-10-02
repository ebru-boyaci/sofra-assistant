import type { SuggestedActionsBlock } from '@/domain/ui-spec'
import styles from './SuggestedActions.module.css'

export type SuggestedActionsProps = {
  block: SuggestedActionsBlock
  onSelect?: (text: string) => void
  disabled?: boolean
}

export function SuggestedActions({
  block,
  onSelect,
  disabled = false,
}: SuggestedActionsProps) {
  if (block.chips.length === 0) return null

  return (
    <div
      className={styles.root}
      data-block="suggested_actions"
      role="group"
      aria-label="Suggested messages"
    >
      {block.chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className={styles.chip}
          disabled={disabled || onSelect == null}
          onClick={() => onSelect?.(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
