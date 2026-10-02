import type { CartSummaryBlock } from '@/domain/ui-spec'
import { formatTry } from '@/shared/formatMoney'
import styles from './CartSummary.module.css'

type Props = {
  block: CartSummaryBlock
}

export function CartSummary({ block }: Props) {
  const belowMinimum = block.meets_minimum === false

  return (
    <section className={styles.root} data-block="cart_summary" aria-label="Cart summary">
      <h3 className={styles.title}>Cart</h3>

      <ul className={styles.items}>
        {block.items.map((item, i) => (
          <li key={`${item.name}-${i}`} className={styles.item}>
            <span className={styles.qty}>{item.qty}×</span>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemPrice}>{formatTry(item.price_try)}</span>
          </li>
        ))}
      </ul>

      <div className={styles.totals}>
        {block.subtotal_try != null && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Subtotal</span>
            <span className={styles.rowValue}>{formatTry(block.subtotal_try)}</span>
          </div>
        )}
        {block.delivery_fee_try != null && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Delivery</span>
            <span className={styles.rowValue}>
              {block.delivery_fee_try === 0
                ? 'Free'
                : formatTry(block.delivery_fee_try)}
            </span>
          </div>
        )}
        <div className={`${styles.row} ${styles.total}`}>
          <span className={styles.rowLabel}>Total</span>
          <span className={styles.rowValue}>{formatTry(block.total_try)}</span>
        </div>
      </div>

      {belowMinimum && (
        <p className={styles.belowMin} role="status">
          <span className={styles.belowMinMark} aria-hidden="true">
            !
          </span>
          <span>
            Below minimum order
            {block.min_order_try != null
              ? ` (${formatTry(block.min_order_try)} required)`
              : ''}
          </span>
        </p>
      )}
    </section>
  )
}
