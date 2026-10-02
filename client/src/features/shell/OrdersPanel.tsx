import { formatRelativeDay } from '@/domain/clock'
import { formatTry } from '@/shared/formatMoney'
import styles from './Shell.module.css'
import { useShellOrders } from './useShellQueries'

export function OrdersPanel() {
  const ordersQuery = useShellOrders()

  return (
    <section className={styles.panel} aria-label="Orders">
      <h2 className={styles.panelTitle}>Orders</h2>

      {ordersQuery.isPending && <p className={styles.placeholder}>Loading…</p>}
      {ordersQuery.isError && (
        <p className={styles.placeholder}>Could not load orders</p>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length === 0 && (
        <p className={styles.placeholder}>No orders yet</p>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length > 0 && (
        <ul className={styles.orderList}>
          {ordersQuery.data.map((order) => (
            <li key={order.order_id} className={styles.orderItem}>
              <div className={styles.orderHeader}>
                <span className={styles.orderRestaurant}>{order.restaurant}</span>
                <span className={styles.orderStatus}>{order.status}</span>
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
