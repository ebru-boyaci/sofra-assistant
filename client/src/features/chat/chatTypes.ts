import type { ConfirmationView } from '@/domain/confirmation'
import type {
  AuditRecord,
  TrustedBlock,
  ValidationFailure,
} from '@/domain/ui-spec'

export type AssistantTurnStatus =
  | 'loading'
  | 'streaming'
  | 'complete'
  | 'stopped'
  | 'incomplete'
  | 'error_retryable'
  | 'error_final'
  | 'rate_limited'
  | 'unsupported_version'

export type UserTurn = {
  id: string
  role: 'user'
  text: string
}

export type AssistantTurn = {
  id: string
  role: 'assistant'
  status: AssistantTurnStatus
  blocks: TrustedBlock[]
  failures: ValidationFailure[]
  audit: AuditRecord | null
  rejectedConfirmation: boolean
  message: string | null
  retryable: boolean
  retryAfterSeconds: number | null
  requestId: string | null
}

export type ChatTurn = UserTurn | AssistantTurn

export type ChatTransportPhase =
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'complete'
  | 'stopped'
  | 'incomplete'
  | 'error_retryable'
  | 'error_final'
  | 'rate_limited'
  | 'unsupported_version'

export type ChatSessionValue = {
  turns: ChatTurn[]
  phase: ChatTransportPhase
  isBusy: boolean
  rateLimited: boolean
  rateLimitedUntil: number | null
  rateLimitedSeconds: number | null
  conversationId: string | null
  send: (raw: string) => Promise<void>
  stop: () => void
  retryLast: () => Promise<void>
  onConfirm: (token: string) => void
  viewFor: (token: string) => ConfirmationView | null
}
