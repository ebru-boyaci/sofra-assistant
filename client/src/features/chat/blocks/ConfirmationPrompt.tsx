import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import styles from './ConfirmationPrompt.module.css'

export type ConfirmationPromptProps = {
  block: ConfirmationPromptBlock
  onConfirm?: (block: ConfirmationPromptBlock) => void
  disabled?: boolean
  busy?: boolean
  expired?: boolean
}

const ACTION_LABEL: Record<ConfirmationPromptBlock['action'], string> = {
  place_order: 'Place order',
  cancel_order: 'Cancel order',
  add_tip: 'Add tip',
}

export function ConfirmationPrompt({
  block,
  onConfirm,
  disabled = false,
  busy = false,
  expired = false,
}: ConfirmationPromptProps) {
  const destructive = block.action === 'cancel_order'
  const inactive = disabled || busy || expired || onConfirm == null

  return (
    <section
      className={`${styles.root}${destructive ? ` ${styles.destructive}` : ''}`}
      data-block="confirmation_prompt"
      aria-label="Confirmation required"
    >
      <div className={styles.header}>
        <p className={styles.kicker}>
          <span className={styles.kickerMark} aria-hidden="true">
            ✓
          </span>
          Confirmation required
        </p>
        <p className={styles.action}>{ACTION_LABEL[block.action]}</p>
      </div>

      <p className={styles.summary}>{block.summary}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirm}
          disabled={inactive}
          aria-disabled={inactive}
          onClick={() => onConfirm?.(block)}
        >
          {busy ? 'Confirming…' : expired ? 'Expired' : 'Confirm'}
        </button>
      </div>

      {expired && (
        <p className={styles.hint} role="status">
          This confirmation expired. Ask again for a fresh one.
        </p>
      )}
    </section>
  )
}
