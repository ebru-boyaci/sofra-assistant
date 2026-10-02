import { formatTry } from '@/shared/formatMoney'
import { MOCK_USERS } from '@/shared/users'
import { useCurrentUser } from '@/shared/useCurrentUser'
import styles from './Shell.module.css'
import { useShellUser } from './useShellQueries'

export function Header() {
  const { userId, setUserId } = useCurrentUser()
  const userQuery = useShellUser()

  const displayName = userQuery.data?.display_name
  const wallet = userQuery.data?.wallet_balance_try

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Sofra</div>
      {displayName != null && (
        <div className={styles.displayName}>{displayName}</div>
      )}
      <label className={styles.userSwitch}>
        <span className={styles.userLabel}>User</span>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value as typeof userId)}
          aria-label="Current user"
        >
          {MOCK_USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.wallet} aria-live="polite">
        {userQuery.isPending && 'Wallet: …'}
        {userQuery.isError && 'Wallet: unavailable'}
        {userQuery.isSuccess && wallet != null && (
          <>
            Wallet: <span className={styles.walletValue}>{formatTry(wallet)}</span>
          </>
        )}
      </div>
    </header>
  )
}
