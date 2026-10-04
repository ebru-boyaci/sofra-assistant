import { useAuditTurnCount } from '@/features/audit'
import { AnalyzeIcon, BagIcon, ReceiptIcon } from '@/shared/ui'
import { useShellCart } from '../useShellQueries'
import styles from './SideRail.module.css'

export type ShellSection = 'cart' | 'orders' | 'audit'

type Props = {
  active: ShellSection
  onChange: (section: ShellSection) => void
}

const TABS: {
  id: ShellSection
  label: string
  Icon: typeof BagIcon
}[] = [
  { id: 'cart', label: 'Cart', Icon: BagIcon },
  { id: 'orders', label: 'Orders', Icon: ReceiptIcon },
  { id: 'audit', label: 'Audit', Icon: AnalyzeIcon },
]

export function SideRail({ active, onChange }: Props) {
  const cartQuery = useShellCart()
  const cartCount =
    cartQuery.data?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0
  const auditCount = useAuditTurnCount()

  return (
    <div className={styles.rail}>
      {TABS.map(({ id, label, Icon }) => {
        const selected = active === id
        const badge =
          id === 'cart' && cartCount > 0
            ? cartCount
            : id === 'audit' && auditCount > 0
              ? auditCount
              : null

        return (
          <button
            key={id}
            type="button"
            className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ''}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <span className={styles.iconWrap}>
              <Icon width="1.15rem" height="1.15rem" />
              {badge != null ? (
                <span className={styles.badge}>{badge}</span>
              ) : null}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
