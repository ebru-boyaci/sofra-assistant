import type { AssistantTurnStatus, ChatTransportPhase } from './chatTypes'

export function statusLabel(status: AssistantTurnStatus | ChatTransportPhase): string {
  switch (status) {
    case 'idle':
      return ''
    case 'loading':
      return 'Thinking…'
    case 'streaming':
      return 'Streaming…'
    case 'complete':
      return ''
    case 'stopped':
      return 'Stopped'
    case 'incomplete':
      return 'Incomplete response'
    case 'error_retryable':
      return 'Temporary failure — you can retry'
    case 'error_final':
      return 'Request failed'
    case 'rate_limited':
      return 'Rate limited — wait before retrying'
    case 'unsupported_version':
      return 'Unsupported response version'
  }
}
