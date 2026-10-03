import styles from './EmptyState.module.css'

type Props = {
  title: string
  hint?: string
}

export function EmptyState({ title, hint }: Props) {
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      {hint != null && hint.length > 0 ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  )
}
