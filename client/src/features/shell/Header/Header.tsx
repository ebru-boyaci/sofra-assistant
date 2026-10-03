import { formatTry } from '@/shared/formatMoney'
import { useCurrentUser } from '@/shared/useCurrentUser'
import styles from '../Shell.module.css'
import { UserSwitcher } from '../UserSwitcher'
import { useShellUser } from '../useShellQueries'

export function Header() {
  const { userId, setUserId } = useCurrentUser()
  const userQuery = useShellUser()
  const wallet = userQuery.data?.wallet_balance_try

  return (
    <header className={styles.header}>
      <div className="textBrand">Sofra</div>
      <div className={`textMeta ${styles.wallet}`} aria-live="polite">
        {userQuery.isPending && 'Wallet: …'}
        {userQuery.isError && 'Wallet: unavailable'}
        {userQuery.isSuccess && wallet != null && (
          <>
            Wallet:{' '}
            <span className={styles.walletValue}>{formatTry(wallet)}</span>
          </>
        )}
      </div>
      <UserSwitcher value={userId} onChange={setUserId} />
    </header>
  )
}
