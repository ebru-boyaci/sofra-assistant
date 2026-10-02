import { type ReactNode } from 'react'
import { ChatSessionContext } from './chat-session-context'
import { useChatController } from './useChatController'

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const chat = useChatController()
  return (
    <ChatSessionContext.Provider value={chat}>
      {children}
    </ChatSessionContext.Provider>
  )
}
