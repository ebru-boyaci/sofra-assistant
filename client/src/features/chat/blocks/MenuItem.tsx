import type { MenuItemBlock } from '@/domain/ui-spec'
import { formatTry } from '@/shared/formatMoney'
import styles from './MenuItem.module.css'

type Props = {
  block: MenuItemBlock
}

export function MenuItem({ block }: Props) {
  const unavailable = !block.available

  return (
    <article
      className={`${styles.root}${unavailable ? ` ${styles.unavailable}` : ''}`}
      data-block="menu_item"
      aria-label={`${block.name}${unavailable ? ', unavailable' : ''}${block.age_restricted ? ', age restricted' : ''}`}
    >
      <div>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{block.name}</h3>
        </div>
        {block.category != null && (
          <p className={styles.category}>{block.category}</p>
        )}
      </div>
      <p className={styles.price}>{formatTry(block.price_try)}</p>

      {(block.age_restricted || unavailable) && (
        <div className={styles.badges}>
          {block.age_restricted && (
            <span className={`${styles.badge} ${styles.age}`}>
              <span className={styles.badgeIcon} aria-hidden="true">
                18+
              </span>
              Age restricted
            </span>
          )}
          {unavailable && (
            <span className={`${styles.badge} ${styles.out}`}>
              <span className={styles.badgeIcon} aria-hidden="true">
                ×
              </span>
              Unavailable
            </span>
          )}
        </div>
      )}
    </article>
  )
}
