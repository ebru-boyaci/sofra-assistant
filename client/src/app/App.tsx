import { AuditInspector } from '@/features/audit'
import { ChatPanel, ChatSessionProvider } from '@/features/chat'
import { CartPanel, Header, OrdersPanel } from '@/features/shell'
import { useCurrentUser } from '@/shared/useCurrentUser'
import styles from './App.module.css'

export function App() {
  const { userId } = useCurrentUser()

  return (
    <div className={styles.root}>
      <a href="#chat-composer" className="skipLink">
        Skip to message composer
      </a>
      <Header />
      <div className={styles.body}>
        <ChatSessionProvider key={userId}>
          <main className={styles.chat} aria-label="Chat">
            <ChatPanel />
          </main>
          <aside className={styles.sidebar} aria-label="Shell">
            <CartPanel />
            <OrdersPanel />
            <AuditInspector />
          </aside>
        </ChatSessionProvider>
      </div>
    </div>
  )
}

