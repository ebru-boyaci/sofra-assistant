import type { ReactNode } from 'react'
import styles from './StatusBadge.module.css'

export type StatusTone = 'info' | 'success' | 'danger' | 'neutral' | 'warning'

type Props = {
  children: ReactNode
  tone?: StatusTone
  status?: string
}

function toneForOrderStatus(status: string): StatusTone {
  switch (status) {
    case 'received':
      return 'info'
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function StatusBadge({ children, tone, status }: Props) {
  const resolved =
    tone ?? (status != null ? toneForOrderStatus(status) : 'neutral')
  return (
    <span className={`${styles.root} ${styles[resolved]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  )
}
