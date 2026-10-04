import { getKbDocument } from '@/infrastructure/api'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import styles from './SourceCitations.module.css'
import { kbTrustHint } from './trustHint'

type Props = {
  docId: string
  onClose: () => void
}

export function KbDocumentDialog({ docId, onClose }: Props) {
  const titleId = useId()
  const query = useQuery({
    queryKey: ['kb', docId],
    queryFn: ({ signal }) => getKbDocument(docId, signal),
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const doc = query.data
  const trust = doc ? kbTrustHint(doc) : null

  return createPortal(
    <>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close document"
        onClick={onClose}
      />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.dialogHead}>
          <div>
            <h2 id={titleId} className={styles.dialogTitle}>
              {doc?.title ?? 'Source'}
            </h2>
            <p className={styles.dialogMeta}>
              {docId}
              {doc?.category ? ` · ${doc.category}` : ''}
              {doc?.date ? ` · ${doc.date}` : ''}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.body}>
          {query.isPending && (
            <p className={styles.status} role="status">
              Loading document…
            </p>
          )}
          {query.isError && (
            <p className={styles.status} role="alert">
              Could not load this document.
            </p>
          )}
          {doc != null && (
            <>
              {trust ? (
                <p className={styles.trust} role="status">
                  {trust}
                </p>
              ) : null}
              {doc.tags.length > 0 ? (
                <ul className={styles.tags}>
                  {doc.tags.map((tag) => (
                    <li key={tag} className={styles.tag}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className={styles.docBody}>{doc.body}</p>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
