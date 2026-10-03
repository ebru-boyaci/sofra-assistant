import { listAssistantTurns, useChatSession } from '@/features/chat'
import { useMemo } from 'react'

export function useAuditTurnCount(): number {
  const { turns } = useChatSession()
  return useMemo(
    () => listAssistantTurns(turns).filter((turn) => turn.audit != null).length,
    [turns],
  )
}
