import type { TextBlock as TextBlockData } from '@/domain/ui-spec'
import { SafeMarkdown } from '@/security'
import styles from './TextBlock.module.css'

type Props = {
  block: TextBlockData
}

export function TextBlock({ block }: Props) {
  const empty = block.markdown.length === 0

  if (empty) {
    return (
      <div
        className={`${styles.root} ${styles.empty}`}
        data-block="text"
        aria-busy
      />
    )
  }

  return (
    <div className={styles.root} data-block="text">
      <SafeMarkdown markdown={block.markdown} />
    </div>
  )
}
