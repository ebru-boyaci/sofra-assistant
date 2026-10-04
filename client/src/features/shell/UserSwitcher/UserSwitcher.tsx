import { useEffect, useId, useRef, useState } from 'react'
import type { UserId } from '@/shared/users'
import { ChevronDownIcon, UserIcon } from '@/shared/ui'
import pill from '../HeaderPill.module.css'
import { useShellUser, useShellUsers } from '../useShellQueries'
import { personaMeta, resolvePersona } from './resolvePersona'
import styles from './UserSwitcher.module.css'

type Props = {
  value: UserId
  onChange: (id: UserId) => void
}

export function UserSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const users = useShellUsers()
  const detail = useShellUser()
  const persona = resolvePersona(value, detail, users)
  const ariaLabel =
    persona.kind === 'ready'
      ? `Persona: ${persona.name}, ${persona.meta}`
      : persona.kind === 'loading'
        ? 'Persona: loading'
        : `Persona: ${persona.id}${persona.meta ? `, ${persona.meta}` : ''}`

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

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={pill.pill}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-busy={persona.kind === 'loading'}
        onClick={() => {
          if (!open && users.isError) void users.refetch()
          setOpen((v) => !v)
        }}
      >
        <UserIcon className={pill.icon} />
        {persona.kind === 'loading' ? (
          <span className={pill.stack} aria-hidden="true">
            <span className={`${styles.placeholder} ${styles.placeholderName}`} />
            <span className={`${styles.placeholder} ${styles.placeholderMeta}`} />
          </span>
        ) : (
          <span className={pill.stack}>
            <span className={pill.primary}>
              {persona.kind === 'ready' ? persona.name : persona.id}
            </span>
            <span className={`${pill.meta} ${styles.role}`}>{persona.meta}</span>
          </span>
        )}
        <ChevronDownIcon className={pill.chevron} />
      </button>

      {open ? (
        <ul
          id={listId}
          className={styles.menu}
          role="listbox"
          aria-label="Switch user"
        >
          {users.isPending || (users.isError && users.isFetching) ? (
            <li role="option" aria-disabled="true" aria-selected={false} className={styles.status}>
              Loading users…
            </li>
          ) : users.isError ? (
            <li role="option" aria-disabled="true" aria-selected={false} className={styles.status}>
              Couldn’t load users. Close and reopen to retry.
            </li>
          ) : null}
          {users.data?.map((user) => {
            const selected = user.id === value
            return (
              <li key={user.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option}${selected ? ` ${styles.optionSelected}` : ''}`}
                  onClick={() => {
                    onChange(user.id)
                    setOpen(false)
                  }}
                >
                  <span className={styles.optionName}>{user.display_name}</span>
                  <span className={styles.optionMeta}>{personaMeta(user)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
