import { useContext } from 'react'
import { ChatSessionContext } from './chat-session-context'
import type { ChatSessionValue } from './chatTypes'

export function useChatSession(): ChatSessionValue {
  const value = useContext(ChatSessionContext)
  if (!value) {
    throw new Error('useChatSession requires ChatSessionProvider')
  }
  return value
}
