import {
  listAssistantTurns,
  useChatSession,
  type AssistantTurn,
} from '@/features/chat'
import { EmptyState, Select } from '@/shared/ui'
import { useMemo, useState, type ReactNode } from 'react'
import styles from './AuditInspector.module.css'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

function EmptyValue() {
  return <span className={styles.muted}>—</span>
}

function DecisionBadge({ decision }: { decision: string }) {
  return <span className={styles.decision}>{decision}</span>
}

function turnOptionLabel(turn: AssistantTurn, index: number): string {
  const decision = turn.audit?.decision ?? turn.status
  return `#${index + 1} · ${decision}`
}

export function AuditInspector() {
  const { turns } = useChatSession()
  const assistants = useMemo(() => listAssistantTurns(turns), [turns])
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const selected =
    (pinnedId
      ? assistants.find((turn) => turn.id === pinnedId)
      : undefined) ??
    assistants[assistants.length - 1] ??
    null

  return (
    <section className={styles.root} aria-label="Audit inspector">
      <header className={styles.header}>
        <h2 className={styles.title}>Audit</h2>
        <p className={styles.subtitle}>Inspector only — not shown in chat UI</p>
      </header>

      {assistants.length === 0 ? (
        <EmptyState
          title="No turns yet"
          hint="Send a message to inspect audit and validation failures."
        />
      ) : (
        <>
          <label className={styles.turnPicker}>
            <span className={styles.turnLabel}>Turn</span>
            <Select
              className={styles.turnSelect}
              value={selected?.id ?? ''}
              onChange={(event) => setPinnedId(event.target.value)}
              aria-label="Assistant turn"
            >
              {assistants.map((turn, index) => (
                <option key={turn.id} value={turn.id}>
                  {turnOptionLabel(turn, index)}
                </option>
              ))}
            </Select>
          </label>

          {selected && <AuditDetails turn={selected} />}
        </>
      )}
    </section>
  )
}

function AuditDetails({ turn }: { turn: AssistantTurn }) {
  const audit = turn.audit

  return (
    <div className={styles.body}>
      <dl className={styles.grid}>
        <Field label="Request">
          {turn.requestId ? (
            <code className={styles.code}>{turn.requestId}</code>
          ) : (
            <EmptyValue />
          )}
        </Field>
        <Field label="Status">
          <code className={styles.code}>{turn.status}</code>
        </Field>
        <Field label="Decision">
          {audit ? <DecisionBadge decision={audit.decision} /> : <EmptyValue />}
        </Field>
        <Field label="Reason">
          {audit?.reason ? audit.reason : <EmptyValue />}
        </Field>
        <Field label="Intent">
          {audit?.intent ? (
            <code className={styles.code}>{audit.intent}</code>
          ) : (
            <EmptyValue />
          )}
        </Field>
        <Field label="Tools">
          {audit?.tools_called && audit.tools_called.length > 0 ? (
            <ul className={styles.chipList}>
              {audit.tools_called.map((tool) => (
                <li key={tool} className={styles.chip}>
                  {tool}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </Field>
        <Field label="KB docs">
          {audit?.kb_doc_ids && audit.kb_doc_ids.length > 0 ? (
            <ul className={styles.chipList}>
              {audit.kb_doc_ids.map((id) => (
                <li key={id} className={styles.chip}>
                  {id}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </Field>
      </dl>

      {turn.rejectedConfirmation && (
        <p className={styles.banner} role="status">
          Malformed confirmation rejected — Confirm was not rendered.
        </p>
      )}

      <div className={styles.failures}>
        <h3 className={styles.failuresTitle}>
          Validation failures ({turn.failures.length})
        </h3>
        {turn.failures.length === 0 ? (
          <p className={styles.muted}>None for this turn.</p>
        ) : (
          <ul className={styles.failureList}>
            {turn.failures.map((failure, index) => (
              <li
                key={`${failure.index}-${failure.kind}-${index}`}
                className={styles.failureItem}
              >
                <div className={styles.failureHead}>
                  <span className={styles.failureKind}>{failure.kind}</span>
                  <span className={styles.failureMeta}>
                    index {failure.index}
                    {failure.type ? ` · ${failure.type}` : ''}
                  </span>
                </div>
                <p className={styles.failureMessage}>{failure.message}</p>
                {failure.details.length > 0 && (
                  <ul className={styles.detailList}>
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
        )}
      </div>
    </div>
  )
}
