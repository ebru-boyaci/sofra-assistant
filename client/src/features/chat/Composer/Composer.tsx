import { ArrowUpIcon, Button, TextArea } from '@/shared/ui'
import styles from './Composer.module.css'

type Props = {
  disabled?: boolean
  busy?: boolean
  rateLimited?: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export function Composer({
  disabled = false,
  busy = false,
  rateLimited = false,
  onSend,
  onStop,
}: Props) {
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (disabled || rateLimited) return
        const form = event.currentTarget
        const data = new FormData(form)
        const text = String(data.get('message') ?? '')
        if (!text.trim()) return
        onSend(text)
        form.reset()
      }}
    >
      <label className={styles.srOnly} htmlFor="chat-composer">
        Message
      </label>
      <div className={styles.field}>
        <TextArea
          id="chat-composer"
          className={styles.input}
          name="message"
          rows={1}
          placeholder={
            rateLimited
              ? 'Rate limited — wait to send…'
              : 'Message Sofra…'
          }
          disabled={disabled || rateLimited}
          aria-describedby="chat-composer-hint"
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }}
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={onStop}>
            Stop
          </Button>
        ) : null}
        <Button
          type="submit"
          className={styles.send}
          disabled={disabled || rateLimited}
          aria-label={busy ? 'Send and replace the current response' : 'Send'}
        >
          <ArrowUpIcon width="1.05rem" height="1.05rem" />
          Send
        </Button>
      </div>
      <p id="chat-composer-hint" className={styles.hint}>
        Enter sends a message — it never confirms. Shift+Enter for a new line.
      </p>
    </form>
  )
}
