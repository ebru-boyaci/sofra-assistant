import { createContext } from 'react'
import type { ConfirmationStore } from '@/domain/confirmation'

export const ConfirmationContext = createContext<ConfirmationStore | null>(null)
