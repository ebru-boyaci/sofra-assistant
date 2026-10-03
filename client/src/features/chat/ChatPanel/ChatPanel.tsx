import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import { Composer } from '../Composer'
import { MessageList } from '../MessageList'
import { statusLabel } from '../statusLabel'
import { useChatSession } from '../useChatSession'
import styles from './ChatPanel.module.css'

export function ChatPanel() {
  const chat = useChatSession()

  return (
    <section className={styles.root} aria-label="Chat">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Chat</h1>
          <p className={styles.meta}>
            {chat.conversationId
              ? `Conversation ${chat.conversationId}`
              : 'New conversation'}
          </p>
        </div>
        {chat.phase !== 'idle' && chat.phase !== 'complete' && (
          <p className={styles.phase} aria-live="polite">
            {statusLabel(chat.phase)}
            {chat.rateLimitedSeconds != null
              ? ` (${chat.rateLimitedSeconds}s)`
              : ''}
          </p>
        )}
      </header>

      <div className={styles.scroll}>
        <MessageList
          turns={chat.turns}
          getConfirmView={chat.viewFor}
          onConfirm={(block: ConfirmationPromptBlock) => {
            chat.onConfirm(block.confirm_token)
          }}
          onSuggestedAction={(text) => {
            void chat.send(text)
          }}
          onRetry={() => {
            void chat.retryLast()
          }}
        />
      </div>

      <Composer
        busy={chat.isBusy}
        rateLimited={chat.rateLimited}
        onSend={(text) => {
          void chat.send(text)
        }}
        onStop={chat.stop}
      />
    </section>
  )
}
