import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { UserContext } from './user-context'
import { DEFAULT_USER_ID, type UserId } from './users'

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<UserId>(DEFAULT_USER_ID)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const setUserId = useCallback((id: UserId) => {
    setUserIdState(id)
    setConversationId(null)
  }, [])

  const value = useMemo(
    () => ({ userId, setUserId, conversationId, setConversationId }),
    [userId, setUserId, conversationId],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
