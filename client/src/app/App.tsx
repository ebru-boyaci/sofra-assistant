import { AuditInspector } from '@/features/audit'
import { ChatPanel, ChatSessionProvider } from '@/features/chat'
import { HelpPanel } from '@/features/help'
import {
  CartPanel,
  Header,
  OrdersPanel,
  SideRail,
  type ShellSection,
} from '@/features/shell'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { useEffect, useId, useState } from 'react'
import styles from './App.module.css'

const SECTION_TITLE: Record<ShellSection, string> = {
  cart: 'Cart',
  orders: 'Orders',
  audit: 'Audit',
  help: 'Help',
}

function ShellPanel({ section }: { section: ShellSection }) {
  switch (section) {
    case 'orders':
      return <OrdersPanel />
    case 'audit':
      return <AuditInspector />
    case 'help':
      return <HelpPanel />
    case 'cart':
      return <CartPanel />
  }
}

export function App() {
  const { userId } = useCurrentUser()
  const [section, setSection] = useState<ShellSection>('cart')
  const [shellOpen, setShellOpen] = useState(false)
  const [isPhone, setIsPhone] = useState(false)
  const sheetTitleId = useId()
  const sheetActive = isPhone && shellOpen

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const sync = () => {
      const phone = media.matches
      setIsPhone(phone)
      if (!phone) setShellOpen(false)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!sheetActive) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShellOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sheetActive])

  function handleSectionChange(next: ShellSection) {
    if (isPhone && shellOpen && next === section) {
      setShellOpen(false)
      return
    }
    setSection(next)
    if (isPhone) setShellOpen(true)
  }

  return (
    <div className={styles.root}>
      <a href="#chat-composer" className="skipLink">
        Skip to message composer
      </a>
      <Header />
      <div className={styles.body}>
        <ChatSessionProvider key={userId}>
          <nav className={styles.nav} aria-label="Sections">
            <SideRail active={section} onChange={handleSectionChange} />
          </nav>

          {sheetActive ? (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Close panel"
              onClick={() => setShellOpen(false)}
            />
          ) : null}

          <aside
            className={`${styles.sidebar}${sheetActive ? ` ${styles.sidebarOpen}` : ''}`}
            aria-label="Shell"
            aria-labelledby={sheetActive ? sheetTitleId : undefined}
            aria-modal={sheetActive ? true : undefined}
            aria-hidden={isPhone && !shellOpen ? true : undefined}
            inert={isPhone && !shellOpen ? true : undefined}
            role={sheetActive ? 'dialog' : undefined}
          >
            <div className={styles.sheetChrome}>
              <h2 id={sheetTitleId} className={styles.sheetTitle}>
                {SECTION_TITLE[section]}
              </h2>
              <div className={styles.sheetHandle} aria-hidden="true" />
            </div>
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
