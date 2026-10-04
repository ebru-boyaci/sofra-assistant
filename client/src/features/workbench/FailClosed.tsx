import { parseBlockList, parseUiSpecDocument } from '@/domain/ui-spec'
import type { ValidationFailure } from '@/domain/ui-spec'
import { BlockList } from '@/features/chat/BlockList'
import styles from './FailClosed.module.css'

function FailureList({ failures }: { failures: readonly ValidationFailure[] }) {
  if (failures.length === 0) {
    return <p className={styles.empty}>No validation failures.</p>
  }

  return (
    <ul className={styles.failures}>
      {failures.map((failure) => (
        <li key={`${failure.index}-${failure.kind}-${failure.type ?? 'none'}`}>
          <p className={styles.failureHead}>
            <span className={styles.kind}>{failure.kind}</span>
            <span>
              index {failure.index}
              {failure.type != null ? ` · ${failure.type}` : ''}
            </span>
          </p>
          <p className={styles.message}>{failure.message}</p>
          {failure.details.length > 0 && (
            <ul className={styles.details}>
              {failure.details.map((detail) => (
                <li key={detail}>
                  <code>{detail}</code>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function RawPayload({ value }: { value: unknown }) {
  return (
    <details className={styles.raw}>
      <summary>Raw payload</summary>
      <pre>
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </details>
  )
}

export function FailClosedBlocks({
  rawBlocks,
  note,
}: {
  rawBlocks: readonly unknown[]
  note?: string
}) {
  const parsed = parseBlockList(rawBlocks)

  return (
    <div className={styles.root}>
      {note != null && <p className={styles.note}>{note}</p>}
      <section className={styles.section}>
        <h3 className={styles.heading}>Transcript</h3>
        {parsed.blocks.length === 0 ? (
          <p className={styles.empty}>No trusted blocks. Nothing is drawn.</p>
        ) : (
          <BlockList
            blocks={parsed.blocks}
            onConfirm={() => undefined}
            onSuggestedAction={() => undefined}
          />
        )}
        {parsed.rejectedConfirmation && (
          <p className={styles.banner} role="status">
            Malformed confirmation rejected — Confirm was not rendered.
          </p>
        )}
      </section>
      <section className={styles.section}>
        <h3 className={styles.heading}>Validator</h3>
        <FailureList failures={parsed.failures} />
      </section>
      <RawPayload value={rawBlocks} />
    </div>
  )
}

export function FailClosedDocument({
  raw,
  note,
}: {
  raw: unknown
  note?: string
}) {
  const parsed = parseUiSpecDocument(raw)

  return (
    <div className={styles.root}>
      {note != null && <p className={styles.note}>{note}</p>}
      <section className={styles.section}>
        <h3 className={styles.heading}>Transcript</h3>
        {parsed.ok && parsed.blocks.length > 0 ? (
          <BlockList
            blocks={parsed.blocks}
            onConfirm={() => undefined}
            onSuggestedAction={() => undefined}
          />
        ) : (
          <p className={styles.empty}>
            Document refused. No blocks are drawn.
          </p>
        )}
      </section>
      <section className={styles.section}>
        <h3 className={styles.heading}>Validator</h3>
        <FailureList failures={parsed.failures} />
      </section>
      <RawPayload value={raw} />
    </div>
  )
}
