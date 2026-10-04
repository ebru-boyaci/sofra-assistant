import type { ConfirmationView } from '@/domain/confirmation'
import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import { Button, Chip } from '@/shared/ui'
import { useEffect, useRef } from 'react'
import bubbles from '../assets/chat-bubbles.png'
import { BlockList } from '../BlockList'
import type { AssistantTurnStatus, ChatTurn } from '../chatTypes'
import { statusLabel } from '../statusLabel'
import styles from './MessageList.module.css'

const STARTER_PROMPTS = [
  { emoji: '🛒', text: 'What is in my cart?' },
  { emoji: '🍕', text: 'Is there a pizza place near me?' },
  { emoji: '🍔', text: 'Order 2 cheeseburgers from Burger Stop' },
  { emoji: '🧾', text: 'Show my recent orders' },
  { emoji: '🛵', text: 'How much is the delivery fee?' },
] as const

type Props = {
  turns: readonly ChatTurn[]
  getConfirmView: (token: string) => ConfirmationView | null
  onConfirm: (block: ConfirmationPromptBlock) => void
  onSuggestedAction: (text: string) => void
  onRetry?: () => void
  retryCooldown?: boolean
  retryCooldownSeconds?: number | null
}

function confirmLayoutKey(
  turns: readonly ChatTurn[],
  getConfirmView: (token: string) => ConfirmationView | null,
): string {
  const parts: string[] = []
  for (const turn of turns) {
    if (turn.role !== 'assistant') continue
    for (const block of turn.blocks) {
      if (block.type !== 'confirmation_prompt') continue
      const view = getConfirmView(block.confirm_token)
      parts.push(
        `${block.confirm_token}:${view?.status ?? 'none'}:${view?.nextBlocks?.length ?? 0}`,
      )
    }
  }
  return parts.join('|')
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
  retryCooldown = false,
  retryCooldownSeconds = null,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const confirmLayout = confirmLayoutKey(turns, getConfirmView)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns, confirmLayout])

  if (turns.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className={styles.empty}>
          <img
            className={styles.bubbles}
            src={bubbles}
            alt=""
          />
          <h2 className={styles.welcome}>Welcome to Sofra</h2>
          <p className={styles.welcomeHint}>
            Ask about restaurants, your cart, or place an order.
          </p>
          <div className={styles.starters} role="group" aria-label="Example messages">
            {STARTER_PROMPTS.map((prompt) => (
              <Chip
                key={prompt.text}
                onClick={() => onSuggestedAction(prompt.text)}
              >
                <span aria-hidden="true">{prompt.emoji}</span>
                {prompt.text}
              </Chip>
            ))}
          </div>
        </div>
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
                  <p className={styles.thinking} aria-live="polite">
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
                    disabled={retryCooldown}
                  >
                    {retryCooldown && retryCooldownSeconds != null
                      ? `Retry (${retryCooldownSeconds}s)`
                      : 'Retry'}
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
