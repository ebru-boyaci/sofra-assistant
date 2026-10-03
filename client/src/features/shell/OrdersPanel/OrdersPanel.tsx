import { formatRelativeDay } from '@/domain/clock'
import { formatTry } from '@/shared/formatMoney'
import { EmptyState, Skeleton, StatusBadge } from '@/shared/ui'
import styles from '../Shell.module.css'
import { useShellOrders } from '../useShellQueries'

function lead(value: string): string {
  return value.replace(/^./u, (char) => char.toLocaleUpperCase('en-US'))
}

export function OrdersPanel() {
  const ordersQuery = useShellOrders()

  return (
    <section className={styles.panel} aria-label="Orders">
      <h2 className={styles.panelTitle}>Orders</h2>

      {ordersQuery.isPending && <Skeleton lines={3} label="Loading orders" />}
      {ordersQuery.isError && (
        <p className={styles.placeholder}>Could not load orders</p>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length === 0 && (
        <EmptyState title="None yet" hint="Confirmed orders show here." />
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length > 0 && (
        <ul className={styles.orderList}>
          {ordersQuery.data.map((order) => (
            <li key={order.order_id} className={styles.orderItem}>
              <div className={styles.orderMain}>
                <div className={styles.orderText}>
                  <div className={styles.orderTitleRow}>
                    <span className={styles.orderRestaurant}>{order.restaurant}</span>
                    <StatusBadge status={order.status}>{lead(order.status)}</StatusBadge>
                  </div>
                  <span className={styles.orderDate} title={order.date}>
                    {lead(formatRelativeDay(order.date))}
                  </span>
                </div>
                <span className={styles.orderPrice}>{formatTry(order.total_try)}</span>
              </div>
              {order.tips_try > 0 && (
                <p className={styles.orderExtra}>Tip {formatTry(order.tips_try)}</p>
              )}
              {order.note.length > 0 && (
                <p className={styles.orderNote}>{order.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
