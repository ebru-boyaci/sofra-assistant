import type { ReactElement } from 'react'
import styles from './StateStack.module.css'

export type StateItem = {
  name: string
  node: ReactElement
  note?: string
}

export function StateStack({ items }: { items: readonly StateItem[] }) {
  return (
    <div className={styles.stack}>
      {items.map((item) => (
        <section key={item.name} className={styles.frame}>
          <h2 className={styles.label}>{item.name}</h2>
          {item.note != null && <p className={styles.note}>{item.note}</p>}
          <div className={styles.body}>{item.node}</div>
        </section>
      ))}
    </div>
  )
}
