import type { ErrorBlock as ErrorBlockData } from '@/domain/ui-spec'
import styles from './ErrorBlock.module.css'

type Props = {
  block: ErrorBlockData
}

export function ErrorBlockView({ block }: Props) {
  return (
    <div
      className={styles.root}
      data-block="error"
      role="alert"
      aria-label="Error"
    >
      <div className={styles.header}>
        <p className={styles.kicker}>Error</p>
        <p className={styles.code}>{block.code}</p>
      </div>
      <p className={styles.message}>{block.message}</p>
    </div>
  )
}
