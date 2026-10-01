import { createContext } from 'react'
import type { UserId } from './users'

export type UserContextValue = {
  userId: UserId
  setUserId: (id: UserId) => void
}

export const UserContext = createContext<UserContextValue | null>(null)
