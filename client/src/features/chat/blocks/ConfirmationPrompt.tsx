import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import type { ConfirmationView } from '@/domain/confirmation'
import styles from './ConfirmationPrompt.module.css'

export type ConfirmationPromptProps = {
  block: ConfirmationPromptBlock
  onConfirm?: (block: ConfirmationPromptBlock) => void
  view?: ConfirmationView | null
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
  view = null,
  disabled = false,
  busy = false,
  expired = false,
}: ConfirmationPromptProps) {
  const destructive = block.action === 'cancel_order'
  const isBusy = view?.busy ?? busy
  const isExpired = view?.expired ?? expired
  const isSuperseded = view?.superseded ?? false
  const inactive =
    disabled ||
    onConfirm == null ||
    (view != null ? !view.canConfirm : isBusy || isExpired || isSuperseded)

  const label =
    view?.buttonLabel ??
    (isBusy ? 'Confirming…' : isExpired ? 'Expired' : 'Confirm')

  return (
    <section
      className={`${styles.root}${destructive ? ` ${styles.destructive}` : ''}${isSuperseded ? ` ${styles.replaced}` : ''}`}
      data-block="confirmation_prompt"
      data-status={view?.status ?? 'LIVE'}
      aria-label="Confirmation required"
    >
      <div className={styles.header}>
        <p className={styles.kicker}>
          <span className={styles.kickerMark} aria-hidden="true">
            ✓
          </span>
          {isSuperseded ? 'Replaced confirmation' : 'Confirmation required'}
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
          {label}
        </button>
      </div>

      {(isExpired || isSuperseded || view?.message) && (
        <p className={styles.hint} role="status">
          {view?.message ??
            (isSuperseded
              ? 'Replaced by a newer confirmation.'
              : 'This confirmation expired. Ask again for a fresh one.')}
        </p>
      )}
    </section>
  )
}
