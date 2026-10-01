import styles from './Shell.module.css'

export function OrdersPanel() {
  return (
    <section className={styles.panel} aria-label="Orders">
      <h2 className={styles.panelTitle}>Orders</h2>
      <p className={styles.placeholder}>Not loaded yet</p>
    </section>
  )
}
