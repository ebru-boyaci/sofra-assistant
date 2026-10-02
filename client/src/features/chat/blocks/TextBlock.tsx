import type { TextBlock as TextBlockData } from '@/domain/ui-spec'
import styles from './TextBlock.module.css'

type Props = {
  block: TextBlockData
}

export function TextBlock({ block }: Props) {
  const empty = block.markdown.length === 0

  return (
    <div
      className={`${styles.root}${empty ? ` ${styles.empty}` : ''}`}
      data-block="text"
      aria-busy={empty || undefined}
    >
      {block.markdown}
    </div>
  )
}
