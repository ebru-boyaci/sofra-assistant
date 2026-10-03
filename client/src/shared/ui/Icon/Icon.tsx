import type { ReactNode, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
  title?: string
}

function BaseIcon({ title, children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25rem"
      height="1.25rem"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function WalletIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 8.5h17a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18V7a1.5 1.5 0 0 1 1.5-1.5H16" />
      <path d="M16 13.5h2.5" />
    </BaseIcon>
  )
}

export function UserIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </BaseIcon>
  )
}

export function ChevronDownIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M7 10l5 5 5-5" />
    </BaseIcon>
  )
}

export function ArrowUpIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 19V6" />
      <path d="M6.5 11.5L12 6l5.5 5.5" />
    </BaseIcon>
  )
}

export function ChevronRightIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M9 6l6 6-6 6" />
    </BaseIcon>
  )
}

export function InfoIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11.2V16" />
      <path d="M12 8h.01" />
    </BaseIcon>
  )
}

export function ChatIcon(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M5.5 16.8c-1.2-.9-2-2.3-2-3.9C3.5 9 6.9 6 12 6s8.5 3 8.5 6.9-3.4 6.9-8.5 6.9c-.9 0-1.8-.1-2.6-.3L5 20.2l.5-3.4Z" />
      <path d="M9 12.2h.01M12 12.2h.01M15 12.2h.01" strokeWidth="2.2" />
    </BaseIcon>
  )
}

export function BagIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <path d="M8.4 9.4 10.5 5a1.1 1.1 0 0 1 1.9 0l2.1 4.4" />
      <path d="M5 10.2h14l-1.7 8.2a1.5 1.5 0 0 1-1.5 1.2H8.2a1.5 1.5 0 0 1-1.5-1.2L5 10.2Z" />
      <path d="M9.3 13.5v3.1M12 13.5v3.1M14.7 13.5v3.1" />
    </BaseIcon>
  )
}

export function ReceiptIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <path d="M7 4.5h7.2L17 7.3v12.2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
      <path d="M14.2 4.5v2.8H17" />
      <path d="M9 11.2h5.2M9 14.4h3.8" />
    </BaseIcon>
  )
}

export function AnalyzeIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <path d="M4 19V8.5M7.2 19V12M10.4 19V10M13.2 19v-5" />
      <circle cx="16.2" cy="12.2" r="3.1" />
      <path d="M18.4 14.4 21 17" />
    </BaseIcon>
  )
}

export function AlertIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <path d="M12 4.2 20.2 18.5a1 1 0 0 1-.87 1.5H4.67a1 1 0 0 1-.87-1.5L12 4.2Z" />
      <path d="M12 10v4.2" />
      <path d="M12 16.8h.01" strokeWidth="2.2" />
    </BaseIcon>
  )
}

export function LockIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <rect x="6.5" y="11" width="11" height="9" rx="2" />
      <path d="M9 11V8.2a3 3 0 0 1 6 0V11" />
    </BaseIcon>
  )
}

export function BanIcon(props: Props) {
  return (
    <BaseIcon strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M7.8 7.8 16.2 16.2" />
    </BaseIcon>
  )
}
