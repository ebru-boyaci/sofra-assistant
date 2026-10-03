import { formatTry } from '@/shared/formatMoney'
import { EmptyState, Skeleton } from '@/shared/ui'
import styles from '../Shell.module.css'
import { useShellCart } from '../useShellQueries'

export function CartPanel() {
  const cartQuery = useShellCart()

  return (
    <section className={styles.panel} aria-label="Cart">
      <h2 className={styles.panelTitle}>Cart</h2>

      {cartQuery.isPending && <Skeleton lines={3} label="Loading cart" />}
      {cartQuery.isError && (
        <p className={styles.placeholder}>Could not load cart</p>
      )}

      {cartQuery.isSuccess && (
        <>
          {cartQuery.data.restaurant_name != null && (
            <p className={styles.restaurant}>{cartQuery.data.restaurant_name}</p>
          )}

          {cartQuery.data.items.length === 0 ? (
            <EmptyState title="Empty" hint="Add items from chat." />
          ) : (
            <ul className={styles.list}>
              {cartQuery.data.items.map((item) => (
                <li key={item.item_id} className={styles.listRow}>
                  <span className={styles.qty}>{item.qty}×</span>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.price}>{formatTry(item.price_try)}</span>
                </li>
              ))}
            </ul>
          )}

          {cartQuery.data.quote != null && (
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className={styles.price}>
                  {formatTry(cartQuery.data.quote.subtotal_try)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span>Delivery</span>
                <span className={styles.price}>
                  {cartQuery.data.quote.delivery_fee_try === 0
                    ? 'Free'
                    : formatTry(cartQuery.data.quote.delivery_fee_try)}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalStrong}`}>
                <span>Total</span>
                <span className={styles.price}>
                  {formatTry(cartQuery.data.quote.total_try)}
                </span>
              </div>
              {!cartQuery.data.quote.meets_minimum && (
                <p className={styles.warning} role="status">
                  Below minimum ({formatTry(cartQuery.data.quote.min_order_try)})
                </p>
              )}
              {!cartQuery.data.quote.sufficient_funds && (
                <p className={styles.warning} role="status">
                  Insufficient wallet funds
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
