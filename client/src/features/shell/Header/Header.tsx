import { formatTry } from '@/shared/formatMoney'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { WalletIcon } from '@/shared/ui'
import pill from '../HeaderPill.module.css'
import { UserSwitcher } from '../UserSwitcher'
import { useShellUser } from '../useShellQueries'
import styles from './Header.module.css'

export function Header() {
  const { userId, setUserId } = useCurrentUser()
  const userQuery = useShellUser()
  const wallet = userQuery.data?.wallet_balance_try

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Sofra</div>
      <div className={styles.actions}>
        <div className={pill.pill} aria-live="polite">
          <WalletIcon className={pill.icon} />
          <div className={pill.stack}>
            <span className={pill.meta}>Wallet</span>
            <span className={`${pill.primary} ${styles.amount}`}>
              {userQuery.isPending && '…'}
              {userQuery.isError && '—'}
              {userQuery.isSuccess && wallet != null && formatTry(wallet)}
            </span>
          </div>
        </div>
        <UserSwitcher value={userId} onChange={setUserId} />
      </div>
    </header>
  )
}
