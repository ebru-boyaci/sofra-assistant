import type { MenuItemBlock } from '@/domain/ui-spec'
import { MenuItem } from './MenuItem'
import styles from './MenuGroup.module.css'

type Props = {
  categoryTitle?: string
  items: readonly MenuItemBlock[]
}

export function MenuGroup({ categoryTitle, items }: Props) {
  if (items.length === 0) return null

  return (
    <section
      className={styles.group}
      data-block="menu_group"
      aria-label={categoryTitle != null ? `${categoryTitle} menu` : 'Menu items'}
    >
      {categoryTitle != null && (
        <h3 className={styles.categoryTitle}>{categoryTitle}</h3>
      )}
      <ul className={styles.rows}>
        {items.map((item) => (
          <li key={item.item_id} className={styles.row}>
            <MenuItem block={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
