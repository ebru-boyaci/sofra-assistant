import type { MenuItemBlock } from '@/domain/ui-spec'
import { formatTry } from '@/shared/formatMoney'
import { BanIcon } from '@/shared/ui'
import styles from './MenuItem.module.css'

type Props = {
  block: MenuItemBlock
}

export function MenuItem({ block }: Props) {
  const unavailable = !block.available
  const showBadges = block.age_restricted || unavailable
  const toneClass = unavailable
    ? styles.unavailable
    : block.age_restricted
      ? styles.ageRestricted
      : ''

  return (
    <article
      className={[styles.root, toneClass].filter(Boolean).join(' ')}
      data-block="menu_item"
      aria-label={`${block.name}${unavailable ? ', unavailable' : ''}${block.age_restricted ? ', age restricted' : ''}`}
    >
      {showBadges && (
        <div className={styles.badges}>
          {block.age_restricted && (
            <span className={`${styles.badge} ${styles.age}`}>
              <span className={styles.ageMark} aria-hidden="true">
                18+
              </span>
              Age restricted
            </span>
          )}
          {unavailable && (
            <span className={`${styles.badge} ${styles.out}`}>
              <BanIcon className={styles.badgeIcon} />
              Out of stock
            </span>
          )}
        </div>
      )}
      <h4 className={styles.name}>{block.name}</h4>
      <p className={styles.price}>{formatTry(block.price_try)}</p>
    </article>
  )
}
