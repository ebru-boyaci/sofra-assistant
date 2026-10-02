import type { ConfirmationPromptBlock, TrustedBlock } from '@/domain/ui-spec'

export type ConfirmationStatus =
  | 'LIVE'
  | 'CONFIRMING'
  | 'DONE'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'REJECTED'
  | 'RECONCILING'

export type ConfirmationEntry = {
  token: string
  userId: string
  prompt: ConfirmationPromptBlock
  status: ConfirmationStatus
  message: string | null
  nextBlocks: TrustedBlock[] | null
  result: unknown | null
}

export type ConfirmationView = {
  status: ConfirmationStatus
  canConfirm: boolean
  busy: boolean
  expired: boolean
  superseded: boolean
  message: string | null
  nextBlocks: TrustedBlock[] | null
  buttonLabel: string
}

export type ExecuteOutcomeInput = {
  httpStatus: number
  body: unknown
}

export type StatusOutcomeInput = {
  state: 'live' | 'expired' | 'used' | 'superseded' | 'void' | 'invalid'
  result?: unknown
}
