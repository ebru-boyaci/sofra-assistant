import { useChatSession } from '@/features/chat'
import { useConfirmation } from '@/features/confirmation'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { formatTry } from '@/shared/formatMoney'
import { Button, ChevronRightIcon, EmptyState, InfoIcon, Skeleton } from '@/shared/ui'
import styles from '../Shell.module.css'
import { useShellCart } from '../useShellQueries'

export function CartPanel() {
  const cartQuery = useShellCart()
  const chat = useChatSession()
  const { userId } = useCurrentUser()
  const { store } = useConfirmation()
  const cart = cartQuery.isSuccess ? cartQuery.data : null
  const canOrder = cart != null && cart.items.length > 0 && cart.quote != null
  const hasOpenConfirm = store.getAll().some(
    (entry) =>
      entry.userId === userId &&
      (entry.status === 'LIVE' ||
        entry.status === 'CONFIRMING' ||
        entry.status === 'RECONCILING'),
  )

  return (
    <section className={styles.panel} aria-label="Cart">
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Cart</h2>
        {cart?.restaurant_name != null && (
          <p className={`${styles.orderRestaurant} ${styles.restaurant}`}>
            {cart.restaurant_name}
          </p>
        )}
      </div>

      {cartQuery.isPending && <Skeleton lines={3} label="Loading cart" />}
      {cartQuery.isError && (
        <p className={styles.placeholder}>Could not load cart</p>
      )}

      {cart != null && (
        <>
          {cart.items.length === 0 ? (
            <EmptyState title="Empty" hint="Add items from chat." />
          ) : (
            <ul className={styles.list}>
              {cart.items.map((item) => (
                <li key={item.item_id} className={styles.listRow}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>{formatTry(item.price_try)}</span>
                </li>
              ))}
            </ul>
          )}

          {cart.quote != null && (
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className={styles.amount}>
                  {formatTry(cart.quote.subtotal_try)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.deliveryLabel}>
                  Delivery
                  <span className={styles.info} title="Delivery fee from the server">
                    <InfoIcon width="0.95rem" height="0.95rem" aria-hidden="true" />
                  </span>
                </span>
                <span className={styles.amount}>
                  {cart.quote.delivery_fee_try === 0
                    ? 'Free'
                    : formatTry(cart.quote.delivery_fee_try)}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalStrong}`}>
                <span>Total</span>
                <span className={styles.amount}>
                  {formatTry(cart.quote.total_try)}
                </span>
              </div>
              {!cart.quote.meets_minimum && (
                <p className={styles.warning} role="status">
                  Below minimum ({formatTry(cart.quote.min_order_try)})
                </p>
              )}
              {!cart.quote.sufficient_funds && (
                <p className={styles.warning} role="status">
                  Insufficient wallet funds
                </p>
              )}
            </div>
          )}

          {canOrder && (
            <Button
              className={styles.placeOrder}
              disabled={chat.isBusy || hasOpenConfirm}
              onClick={() => {
                void chat.send('Order what is in my cart')
              }}
            >
              Place order
              <ChevronRightIcon width="1rem" height="1rem" />
            </Button>
          )}
        </>
      )}
    </section>
  )
}
