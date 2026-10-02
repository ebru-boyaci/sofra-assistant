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
      aria-label={`Error: ${block.code}`}
    >
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          !
        </span>
        <div className={styles.titles}>
          <p className={styles.kicker}>Error</p>
          <p className={styles.code}>{block.code}</p>
        </div>
      </div>
      <p className={styles.message}>{block.message}</p>
    </div>
  )
}
