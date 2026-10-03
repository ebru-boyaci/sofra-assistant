import { useEffect, useId, useRef, useState } from 'react'
import { MOCK_USERS, type UserId } from '@/shared/users'
import { ChevronDownIcon, UserIcon } from '@/shared/ui'
import pill from '../HeaderPill.module.css'
import styles from './UserSwitcher.module.css'

type Props = {
  value: UserId
  onChange: (id: UserId) => void
}

export function UserSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = MOCK_USERS.find((u) => u.id === value) ?? MOCK_USERS[0]

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
        aria-label={`Persona: ${current.name}, ${current.role}`}
        onClick={() => setOpen((v) => !v)}
      >
        <UserIcon className={pill.icon} />
        <span className={pill.stack}>
          <span className={pill.primary}>{current.name}</span>
          <span className={`${pill.meta} ${styles.role}`}>{current.role}</span>
        </span>
        <ChevronDownIcon className={pill.chevron} />
      </button>

      {open ? (
        <ul
          id={listId}
          className={styles.menu}
          role="listbox"
          aria-label="Switch user"
        >
          {MOCK_USERS.map((user) => {
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
                  <span className={styles.optionName}>{user.name}</span>
                  <span className={styles.optionMeta}>{user.role}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
