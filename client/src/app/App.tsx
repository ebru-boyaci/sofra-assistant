import { ChatPanel } from '@/features/chat'
import { CartPanel, Header, OrdersPanel } from '@/features/shell'
import { useCurrentUser } from '@/shared/useCurrentUser'
import styles from './App.module.css'

export function App() {
  const { userId } = useCurrentUser()

  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <main className={styles.chat} aria-label="Chat">
          <ChatPanel key={userId} />
        </main>
        <aside className={styles.sidebar} aria-label="Shell">
          <CartPanel />
          <OrdersPanel />
          <section className={styles.auditStub} aria-label="Audit inspector">
            <h2 className={styles.auditTitle}>Audit</h2>
            <p className={styles.hint}>Inspector placeholder</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
