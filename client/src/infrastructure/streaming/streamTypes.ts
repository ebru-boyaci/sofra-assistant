export type StreamEventName =
  | 'meta'
  | 'block'
  | 'text_delta'
  | 'audit'
  | 'done'
  | 'error'

export type MetaEvent = {
  seq: number
  event: 'meta'
  version: string
  request_id: string
  conversation_id: string
  server_now: string
}

export type BlockEvent = {
  seq: number
  event: 'block'
  index: number
  block: Record<string, unknown>
}

export type TextDeltaEvent = {
  seq: number
  event: 'text_delta'
  index: number
  delta: string
}

export type AuditEvent = {
  seq: number
  event: 'audit'
  audit: Record<string, unknown>
}

export type DoneEvent = {
  seq: number
  event: 'done'
}

export type ErrorEvent = {
  seq: number
  event: 'error'
  code: string
  message: string
  retryable: boolean
}

export type StreamEvent =
  | MetaEvent
  | BlockEvent
  | TextDeltaEvent
  | AuditEvent
  | DoneEvent
  | ErrorEvent

export type StreamStatus =
  | 'streaming' // still arriving
  | 'complete' // got "done"
  | 'incomplete' // body ended, no "done"
  | 'error'
  | 'unsupported_version' // version was not "1"

export type AssembledStream = {
  // The page the screen reads.
  status: StreamStatus
  version: string | null
  requestId: string | null
  conversationId: string | null
  serverNow: string | null
  blocks: Array<Record<string, unknown> | undefined> // cards, in order
  audit: Record<string, unknown> | null
  error: { code: string; message: string; retryable: boolean } | null
}

export const SUPPORTED_UI_VERSION = '1' // only this version is drawn
