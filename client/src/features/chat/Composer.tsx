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
      <textarea
        id="chat-composer"
        name="message"
        className={styles.input}
        rows={2}
        placeholder={
          rateLimited
            ? 'Rate limited — wait to send…'
            : 'Message Sofra…'
        }
        disabled={disabled || rateLimited}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey) return
          event.preventDefault()
          event.currentTarget.form?.requestSubmit()
        }}
      />
      <div className={styles.actions}>
        {busy ? (
          <button type="button" className={styles.stop} onClick={onStop}>
            Stop
          </button>
        ) : null}
        <button
          type="submit"
          className={styles.send}
          disabled={disabled || rateLimited}
        >
          {busy ? 'Send (replace)' : 'Send'}
        </button>
      </div>
    </form>
  )
}
