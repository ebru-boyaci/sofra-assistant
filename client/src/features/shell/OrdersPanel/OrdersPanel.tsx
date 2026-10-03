import { formatRelativeDay } from '@/domain/clock'
import { formatTry } from '@/shared/formatMoney'
import { EmptyState, Skeleton, StatusBadge } from '@/shared/ui'
import styles from '../Shell.module.css'
import { useShellOrders } from '../useShellQueries'

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
              <div className={styles.orderHeader}>
                <span className={styles.orderRestaurant}>{order.restaurant}</span>
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
              </div>
              <div className={styles.orderMeta}>
                <span title={order.date}>{formatRelativeDay(order.date)}</span>
                <span className={styles.price}>{formatTry(order.total_try)}</span>
              </div>
              {order.tips_try > 0 && (
                <div className={styles.orderMeta}>
                  <span>Tips</span>
                  <span className={styles.price}>{formatTry(order.tips_try)}</span>
                </div>
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
