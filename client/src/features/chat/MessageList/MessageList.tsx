import type { ConfirmationView } from '@/domain/confirmation'
import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import { Button, EmptyState } from '@/shared/ui'
import { useEffect, useRef } from 'react'
import { BlockList } from '../BlockList'
import type { AssistantTurnStatus, ChatTurn } from '../chatTypes'
import { statusLabel } from '../statusLabel'
import styles from './MessageList.module.css'

type Props = {
  turns: readonly ChatTurn[]
  getConfirmView: (token: string) => ConfirmationView | null
  onConfirm: (block: ConfirmationPromptBlock) => void
  onSuggestedAction: (text: string) => void
  onRetry?: () => void
}

function statusTone(status: AssistantTurnStatus): string {
  switch (status) {
    case 'error_retryable':
    case 'error_final':
    case 'unsupported_version':
      return styles.statusError
    case 'rate_limited':
    case 'incomplete':
    case 'stopped':
      return styles.statusWarn
    default:
      return styles.statusInfo
  }
}

export function MessageList({
  turns,
  getConfirmView,
  onConfirm,
  onSuggestedAction,
  onRetry,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  if (turns.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          title="Sofra assistant"
          hint="Ask about restaurants, your cart, or place an order."
        />
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
              {(turn.status === 'loading' || turn.status === 'streaming') &&
                turn.blocks.length === 0 && (
                  <p
                    className={`${styles.status} ${statusTone(turn.status)}`}
                    aria-live="polite"
                  >
                    <span className={styles.statusMark} aria-hidden="true">
                      ·
                    </span>
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

              {turn.message &&
                turn.status !== 'streaming' &&
                turn.status !== 'loading' && (
                  <p
                    className={`${styles.message} ${statusTone(turn.status)}`}
                    role="status"
                    data-turn-status={turn.status}
                  >
                    <span className={styles.statusMark} aria-hidden="true">
                      {turn.status.startsWith('error') ||
                      turn.status === 'unsupported_version'
                        ? '!'
                        : turn.status === 'rate_limited' ||
                            turn.status === 'incomplete' ||
                            turn.status === 'stopped'
                          ? '×'
                          : 'i'}
                    </span>
                    {turn.message}
                  </p>
                )}

              {(turn.status === 'error_retryable' ||
                turn.status === 'incomplete' ||
                turn.status === 'rate_limited') &&
                turn.retryable &&
                onRetry && (
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.retry}
                    onClick={onRetry}
                    disabled={turn.status === 'rate_limited'}
                  >
                    Retry
                  </Button>
                )}
            </div>
          )}
        </li>
      ))}
      <li className={styles.anchor} aria-hidden="true">
        <div ref={endRef} />
      </li>
    </ol>
  )
}
