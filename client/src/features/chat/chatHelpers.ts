import {
  AuditSchema,
  parseBlockList,
  type AuditRecord,
  type ConfirmationPromptBlock,
  type TrustedBlock,
} from '@/domain/ui-spec'
import type { AssembledStream } from '@/infrastructure/streaming'
import type { AssistantTurn, AssistantTurnStatus, ChatTurn } from './chatTypes'

export function parseAssemblyBlocks(
  assembly: AssembledStream,
): ReturnType<typeof parseBlockList> {
  const raw = assembly.blocks.filter(
    (block): block is Record<string, unknown> => block != null,
  )
  return parseBlockList(raw)
}

export function parseAssemblyAudit(
  assembly: AssembledStream,
): AuditRecord | null {
  if (!assembly.audit) return null
  const parsed = AuditSchema.safeParse(assembly.audit)
  return parsed.success ? parsed.data : null
}

export function statusFromAssembly(
  assembly: AssembledStream,
  stopped: boolean,
): AssistantTurnStatus {
  if (stopped) return 'stopped'
  if (assembly.status === 'unsupported_version') return 'unsupported_version'
  if (assembly.status === 'error') {
    return assembly.error?.retryable ? 'error_retryable' : 'error_final'
  }
  if (assembly.status === 'incomplete') return 'incomplete'
  if (assembly.status === 'complete') return 'complete'
  return 'streaming'
}

export function registerPromptsFromBlocks(
  userId: string,
  blocks: readonly TrustedBlock[],
  register: (userId: string, block: ConfirmationPromptBlock) => void,
): void {
  for (const block of blocks) {
    if (block.type === 'confirmation_prompt') {
      register(userId, block)
    }
  }
}

let turnSeq = 0

export function nextTurnId(prefix: string): string {
  turnSeq += 1
  return `${prefix}_${turnSeq}_${Date.now().toString(36)}`
}

export function listAssistantTurns(
  turns: readonly ChatTurn[],
): AssistantTurn[] {
  return turns.filter((turn): turn is AssistantTurn => turn.role === 'assistant')
}
