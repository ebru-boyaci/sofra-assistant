import type { ConfirmationView } from '@/domain/confirmation'
import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import { BlockList } from './BlockList'
import type { ChatTurn } from './chatTypes'
import { statusLabel } from './statusLabel'
import styles from './MessageList.module.css'

type Props = {
  turns: readonly ChatTurn[]
  getConfirmView: (token: string) => ConfirmationView | null
  onConfirm: (block: ConfirmationPromptBlock) => void
  onSuggestedAction: (text: string) => void
  onRetry?: () => void
}

export function MessageList({
  turns,
  getConfirmView,
  onConfirm,
  onSuggestedAction,
  onRetry,
}: Props) {
  if (turns.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Sofra assistant</p>
        <p className={styles.emptyHint}>
          Ask about restaurants, your cart, or place an order.
        </p>
      </div>
    )
  }

  return (
    <ol className={styles.list} aria-label="Conversation">
      {turns.map((turn) => (
        <li
          key={turn.id}
          className={`${styles.item} ${turn.role === 'user' ? styles.user : styles.assistant}`}
        >
          <div className={styles.role}>
            {turn.role === 'user' ? 'You' : 'Sofra'}
          </div>

          {turn.role === 'user' ? (
            <p className={styles.userText}>{turn.text}</p>
          ) : (
            <div className={styles.assistantBody}>
              {(turn.status === 'loading' || turn.status === 'streaming') && (
                <p className={styles.status} aria-live="polite">
                  {statusLabel(turn.status)}
                </p>
              )}

              {turn.blocks.length > 0 && (
                <BlockList
                  blocks={turn.blocks}
                  getConfirmView={getConfirmView}
                  onConfirm={onConfirm}
                  onSuggestedAction={onSuggestedAction}
                  suggestedDisabled={
                    turn.status === 'loading' || turn.status === 'streaming'
                  }
                />
              )}

              {turn.message && turn.status !== 'streaming' && turn.status !== 'loading' && (
                <p className={styles.message} role="status">
                  {turn.message}
                </p>
              )}

              {(turn.status === 'error_retryable' ||
                turn.status === 'incomplete' ||
                turn.status === 'rate_limited') &&
                turn.retryable &&
                onRetry && (
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={onRetry}
                    disabled={turn.status === 'rate_limited'}
                  >
                    Retry
                  </button>
                )}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
