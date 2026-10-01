import { useMemo, useState, type ReactNode } from 'react'
import { UserContext } from './user-context'
import { DEFAULT_USER_ID, type UserId } from './users'

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<UserId>(DEFAULT_USER_ID)
  const value = useMemo(() => ({ userId, setUserId }), [userId])
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
