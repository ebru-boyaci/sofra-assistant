import type { VerificationGateBlock } from '@/domain/ui-spec'
import styles from './VerificationGate.module.css'

type Props = {
  block: VerificationGateBlock
}

const REQUIREMENT_LABEL: Record<VerificationGateBlock['requirement'], string> = {
  out_of_service_area: 'out_of_service_area',
  item_unavailable: 'item_unavailable',
  age_18_plus: 'age_18_plus',
  min_order: 'min_order',
  sufficient_funds: 'sufficient_funds',
  not_cancellable: 'not_cancellable',
  tip_window_expired: 'tip_window_expired',
}

export function VerificationGate({ block }: Props) {
  return (
    <aside
      className={styles.root}
      data-block="verification_gate"
      role="status"
      aria-label={`Blocked — nothing executed. ${REQUIREMENT_LABEL[block.requirement]}`}
    >
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          ⊘
        </span>
        <div className={styles.titles}>
          <p className={styles.kicker}>Blocked — nothing executed</p>
          <p className={styles.requirement}>
            {REQUIREMENT_LABEL[block.requirement]}
          </p>
        </div>
      </div>

      <p className={styles.reason}>{block.reason}</p>

      <p className={styles.cta}>
        <span className={styles.ctaLabel}>Next</span>
        <span>{block.cta}</span>
      </p>
    </aside>
  )
}
