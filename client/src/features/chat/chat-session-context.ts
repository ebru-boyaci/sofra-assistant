import { createContext } from 'react'
import type { ChatSessionValue } from './chatTypes'

export type { ChatSessionValue }

export const ChatSessionContext = createContext<ChatSessionValue | null>(null)
