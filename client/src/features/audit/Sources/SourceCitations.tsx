import { useState } from 'react'
import { KbDocumentDialog } from './KbDocumentDialog'
import styles from './SourceCitations.module.css'

type Props = {
  ids: string[]
}

export function SourceCitations({ ids }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (ids.length === 0) return null

  return (
    <>
      <ul className={styles.list}>
        {ids.map((id, index) => {
          const primary = index === 0
          return (
            <li key={id}>
              <button
                type="button"
                className={`${styles.citation}${primary ? ` ${styles.primary}` : ''}`}
                onClick={() => setOpenId(id)}
              >
                {primary ? <span className={styles.primaryMark}>Primary</span> : null}
                {id}
              </button>
            </li>
          )
        })}
      </ul>
      {openId != null ? (
        <KbDocumentDialog docId={openId} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  )
}
