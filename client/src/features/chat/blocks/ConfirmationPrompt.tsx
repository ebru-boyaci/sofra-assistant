import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import type {
  ConfirmationStatus,
  ConfirmationView,
} from '@/domain/confirmation'
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

const STATUS_COPY: Record<
  ConfirmationStatus,
  { kicker: string; mark: string; tone: string }
> = {
  LIVE: { kicker: 'Confirmation required', mark: '!', tone: styles.live },
  CONFIRMING: { kicker: 'Confirming', mark: '…', tone: styles.busy },
  RECONCILING: { kicker: 'Checking status', mark: '…', tone: styles.busy },
  DONE: { kicker: 'Confirmed', mark: '✓', tone: styles.done },
  EXPIRED: { kicker: 'Expired', mark: '×', tone: styles.expired },
  SUPERSEDED: { kicker: 'Replaced', mark: '↻', tone: styles.replaced },
  REJECTED: { kicker: 'Unavailable', mark: '×', tone: styles.rejected },
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
  const status: ConfirmationStatus = view?.status ?? 'LIVE'
  const copy = STATUS_COPY[status]
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
      className={`${styles.root} ${copy.tone}${destructive ? ` ${styles.destructive}` : ''}`}
      data-block="confirmation_prompt"
      data-status={status}
      aria-label={`${copy.kicker}: ${ACTION_LABEL[block.action]}`}
    >
      <div className={styles.header}>
        <p className={styles.kicker}>
          <span className={styles.kickerMark} aria-hidden="true">
            {copy.mark}
          </span>
          {copy.kicker}
        </p>
        <p className={styles.action}>{ACTION_LABEL[block.action]}</p>
      </div>

      <p className={styles.summary}>{block.summary}</p>

      {view?.countdownLabel != null && view.status === 'LIVE' && (
        <p className={styles.countdown} aria-live="polite">
          Expires in{' '}
          <span className={styles.countdownValue}>{view.countdownLabel}</span>
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirm}
          disabled={inactive}
          onClick={() => onConfirm?.(block)}
        >
          {label}
        </button>
      </div>

      {(isExpired || isSuperseded || view?.message || status === 'DONE') && (
        <p className={styles.hint} role="status">
          {view?.message ??
            (status === 'DONE'
              ? 'Confirmed — this control is inactive.'
              : isSuperseded
                ? 'Replaced by a newer confirmation.'
                : 'This confirmation expired. Ask again for a fresh one.')}
        </p>
      )}
    </section>
  )
}
