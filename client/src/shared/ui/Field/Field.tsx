import type { SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string
}

export function TextArea({ className, ...rest }: TextAreaProps) {
  const classes = [styles.control, styles.textarea, className]
    .filter(Boolean)
    .join(' ')
  return <textarea className={classes} {...rest} />
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string
}

export function Select({ className, children, ...rest }: SelectProps) {
  const classes = [styles.control, styles.select, className]
    .filter(Boolean)
    .join(' ')
  return (
    <select className={classes} {...rest}>
      {children}
    </select>
  )
}
