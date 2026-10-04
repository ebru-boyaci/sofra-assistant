import {
  listAssistantTurns,
  useChatSession,
  type AssistantTurn,
} from '@/features/chat'
import shell from '../../shell/Shell.module.css'
import pill from '../../shell/HeaderPill.module.css'
import { ChevronDownIcon, EmptyState } from '@/shared/ui'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { SourceCitations } from '../Sources'
import styles from './AuditInspector.module.css'

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

function EmptyValue() {
  return <span className={styles.muted}>—</span>
}

function decisionTone(decision: string): string {
  switch (decision) {
    case 'answered':
      return styles.decisionAnswered
    case 'needs_confirmation':
      return styles.decisionConfirm
    case 'blocked':
    case 'refused':
      return styles.decisionBlocked
    case 'clarify':
      return styles.decisionClarify
    case 'unknown':
    default:
      return styles.decisionUnknown
  }
}

function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span className={`${styles.decision} ${decisionTone(decision)}`}>
      {decision}
    </span>
  )
}

function statusTone(status: string): string {
  switch (status) {
    case 'complete':
      return styles.statusOk
    case 'loading':
    case 'streaming':
      return styles.statusInfo
    case 'stopped':
    case 'incomplete':
      return styles.statusWarn
    case 'error_retryable':
    case 'error_final':
    case 'rate_limited':
    case 'unsupported_version':
      return styles.statusBad
    default:
      return styles.statusMuted
  }
}

function StatusText({ status }: { status: string }) {
  return (
    <code className={`${styles.code} ${statusTone(status)}`}>{status}</code>
  )
}

function turnDecision(turn: AssistantTurn): string {
  return turn.audit?.decision ?? turn.status
}

function turnPrimary(turn: AssistantTurn, index: number): string {
  return `#${index + 1} · ${turnDecision(turn)}`
}

function TurnPicker({
  assistants,
  selectedId,
  onChange,
}: {
  assistants: AssistantTurn[]
  selectedId: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selectedIndex = Math.max(
    0,
    assistants.findIndex((turn) => turn.id === selectedId),
  )
  const selected = assistants[selectedIndex] ?? assistants[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (selected == null) return null

  return (
    <div className={styles.turnPicker} ref={rootRef}>
      <span className={styles.turnLabel} id={`${listId}-label`}>
        Turn
      </span>
      <button
        type="button"
        className={`${pill.pill} ${styles.turnTrigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={pill.primary}>
          {turnPrimary(selected, selectedIndex)}
        </span>
        <ChevronDownIcon className={pill.chevron} />
      </button>

      {open ? (
        <ul
          id={listId}
          className={styles.turnMenu}
          role="listbox"
          aria-label="Assistant turn"
        >
          {assistants.map((turn, index) => {
            const isSelected = turn.id === selectedId
            return (
              <li key={turn.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.turnOption}${isSelected ? ` ${styles.turnOptionSelected}` : ''}`}
                  onClick={() => {
                    onChange(turn.id)
                    setOpen(false)
                  }}
                >
                  <span className={styles.turnOptionPrimary}>
                    {turnPrimary(turn, index)}
                  </span>
                  <span className={styles.turnOptionMeta}>
                    {turn.status}
                    {turn.requestId ? ` · ${turn.requestId}` : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
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
    <section className={`${shell.panel} ${styles.root}`} aria-label="Audit">
      <h2 className={shell.panelTitle}>Audit</h2>

      {assistants.length === 0 ? (
        <EmptyState title="No turns" hint="Send a message to inspect." />
      ) : (
        <>
          {selected && (
            <>
              <TurnPicker
                assistants={assistants}
                selectedId={selected.id}
                onChange={setPinnedId}
              />
              <AuditDetails turn={selected} />
            </>
          )}
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
        <Field label="Request" className={styles.full}>
          {turn.requestId ? (
            <code className={styles.code}>{turn.requestId}</code>
          ) : (
            <EmptyValue />
          )}
        </Field>
        <Field label="Status">
          <StatusText status={turn.status} />
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
        <Field label="Tools" className={styles.full}>
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
        <Field label="Sources" className={styles.full}>
          {audit?.kb_doc_ids && audit.kb_doc_ids.length > 0 ? (
            <SourceCitations ids={audit.kb_doc_ids} />
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
