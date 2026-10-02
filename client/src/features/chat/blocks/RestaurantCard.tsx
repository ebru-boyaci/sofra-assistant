import type { RestaurantCardBlock } from '@/domain/ui-spec'
import { formatTry } from '@/shared/formatMoney'
import styles from './RestaurantCard.module.css'

type Props = {
  block: RestaurantCardBlock
}

export function RestaurantCard({ block }: Props) {
  return (
    <article className={styles.root} data-block="restaurant_card">
      <h3 className={styles.name}>{block.name}</h3>
      <ul className={styles.meta}>
        {block.cuisine != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>Cuisine</span>
            <span className={styles.value}>{block.cuisine}</span>
          </li>
        )}
        {block.district != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>District</span>
            <span className={styles.value}>{block.district}</span>
          </li>
        )}
        {block.rating != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>Rating</span>
            <span className={styles.value}>{block.rating.toFixed(1)}</span>
          </li>
        )}
        {block.eta_min != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>ETA</span>
            <span className={styles.value}>{block.eta_min} min</span>
          </li>
        )}
        {block.delivery_fee_try != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>Delivery</span>
            <span className={styles.value}>{formatTry(block.delivery_fee_try)}</span>
          </li>
        )}
        {block.min_order_try != null && (
          <li className={styles.metaItem}>
            <span className={styles.label}>Min order</span>
            <span className={styles.value}>{formatTry(block.min_order_try)}</span>
          </li>
        )}
      </ul>
    </article>
  )
}
