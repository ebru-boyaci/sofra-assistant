import { MOCK_USERS } from '../../shared/users'
import { useCurrentUser } from '../../shared/useCurrentUser'
import styles from './Shell.module.css'

export function Header() {
  const { userId, setUserId } = useCurrentUser()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Sofra</div>
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
        Wallet: —
      </div>
    </header>
  )
}
