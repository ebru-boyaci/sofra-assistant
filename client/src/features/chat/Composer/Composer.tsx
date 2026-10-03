import { Button, TextArea } from '@/shared/ui'
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
      <TextArea
        id="chat-composer"
        name="message"
        rows={2}
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
      <p id="chat-composer-hint" className={`textMeta ${styles.hint}`}>
        Enter sends a message — it never confirms. Shift+Enter for a new line.
      </p>
      <div className={styles.actions}>
        {busy ? (
          <Button type="button" variant="secondary" onClick={onStop}>
            Stop
          </Button>
        ) : null}
        <Button type="submit" disabled={disabled || rateLimited}>
          {busy ? 'Send (replace)' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
