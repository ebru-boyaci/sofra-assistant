import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Chip.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function Chip({ className, children, type = 'button', ...rest }: Props) {
  const classes = [styles.root, className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
