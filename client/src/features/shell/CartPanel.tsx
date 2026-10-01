import styles from './Shell.module.css'

export function CartPanel() {
  return (
    <section className={styles.panel} aria-label="Cart">
      <h2 className={styles.panelTitle}>Cart</h2>
      <p className={styles.placeholder}>Not loaded yet</p>
    </section>
  )
}
