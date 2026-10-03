import { AuditInspector } from '@/features/audit'
import { ChatPanel, ChatSessionProvider } from '@/features/chat'
import {
  CartPanel,
  Header,
  OrdersPanel,
  SideRail,
  type ShellSection,
} from '@/features/shell'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { useState } from 'react'
import styles from './App.module.css'

function ShellPanel({ section }: { section: ShellSection }) {
  switch (section) {
    case 'orders':
      return <OrdersPanel />
    case 'audit':
      return <AuditInspector />
    case 'cart':
      return <CartPanel />
  }
}

export function App() {
  const { userId } = useCurrentUser()
  const [section, setSection] = useState<ShellSection>('cart')

  return (
    <div className={styles.root}>
      <a href="#chat-composer" className="skipLink">
        Skip to message composer
      </a>
      <Header />
      <div className={styles.body}>
        <ChatSessionProvider key={userId}>
          <SideRail active={section} onChange={setSection} />
          <aside className={styles.sidebar} aria-label="Shell">
            <div key={section} className={styles.panelStage}>
              <ShellPanel section={section} />
            </div>
          </aside>
          <main className={styles.chat} aria-label="Chat">
            <ChatPanel />
          </main>
        </ChatSessionProvider>
      </div>
    </div>
  )
}
