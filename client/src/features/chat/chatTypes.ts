import type { TrustedBlock, ValidationFailure } from '@/domain/ui-spec'

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
