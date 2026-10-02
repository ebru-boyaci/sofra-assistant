import { formatRelativeDay } from '@/domain/clock'
import type { OrderSummaryBlock } from '@/domain/ui-spec'
import { formatTry } from '@/shared/formatMoney'
import styles from './OrderSummary.module.css'

type Props = {
  block: OrderSummaryBlock
}

function statusClass(status: string): string {
  switch (status) {
    case 'received':
      return styles.received
    case 'delivered':
      return styles.delivered
    case 'cancelled':
      return styles.cancelled
    default:
      return styles.other
  }
}

export function OrderSummary({ block }: Props) {
  const relativeDate =
    block.date != null ? formatRelativeDay(block.date) : null

  return (
    <article className={styles.root} data-block="order_summary">
      <div className={styles.header}>
        <h3 className={styles.title}>
          {block.restaurant ?? `Order ${block.order_id}`}
        </h3>
        <span className={`${styles.status} ${statusClass(block.status)}`}>
          <span className={styles.statusDot} aria-hidden="true" />
          {block.status}
        </span>
      </div>

      <ul className={styles.meta}>
        <li>
          ID <span className={styles.metaValue}>{block.order_id}</span>
        </li>
        {block.total_try != null && (
          <li>
            Total{' '}
            <span className={styles.metaValue}>{formatTry(block.total_try)}</span>
          </li>
        )}
        {block.eta_min != null && (
          <li>
            ETA <span className={styles.metaValue}>{block.eta_min} min</span>
          </li>
        )}
        {relativeDate != null && (
          <li>
            Date{' '}
            <span className={styles.metaValue} title={block.date}>
              {relativeDate}
            </span>
          </li>
        )}
      </ul>

      {block.note != null && block.note.length > 0 && (
        <blockquote className={styles.note}>
          <span className={styles.noteLabel}>Note</span>
          {block.note}
        </blockquote>
      )}
    </article>
  )
}
