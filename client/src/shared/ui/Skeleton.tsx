import styles from './Skeleton.module.css'

type Props = {
  lines?: 2 | 3 | 4
  label?: string
}

export function Skeleton({ lines = 3, label = 'Loading' }: Props) {
  return (
    <div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className={styles.srOnly}>{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`${styles.line} ${index === lines - 1 ? styles.lineShort : ''}`}
        />
      ))}
    </div>
  )
}
