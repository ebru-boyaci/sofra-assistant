import { parseUiSpecDocument } from '@/domain/ui-spec'
import type { ConfirmationPromptBlock, TrustedBlock } from '@/domain/ui-spec'
import type { ActionStatusResponse, ExecuteResponse } from '@/infrastructure/api'
import {
  canStartConfirm,
  isExpiredAt,
  statusAfterExecuteHttp,
  statusAfterReconcile,
  toConfirmationView,
} from './transitions'
import type {
  ConfirmationEntry,
  ConfirmationView,
  StatusOutcomeInput,
} from './types'

export type ConfirmationStoreDeps = {
  getServerNowMs: () => number | null
  execute: (input: {
    user_id: string
    action: string
    params: Record<string, unknown>
    confirm_token: string
  }) => Promise<ExecuteResponse>
  getStatus: (confirmToken: string) => Promise<ActionStatusResponse>
  isTransportError: (error: unknown) => boolean
  onDone?: (entry: ConfirmationEntry) => void
}

function extractErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const blocks = (body as { blocks?: unknown }).blocks
  if (!Array.isArray(blocks)) return null
  for (const block of blocks) {
    if (
      block &&
      typeof block === 'object' &&
      (block as { type?: unknown }).type === 'error' &&
      typeof (block as { code?: unknown }).code === 'string'
    ) {
      return (block as { code: string }).code
    }
  }
  return null
}

function parseNextBlocks(body: unknown): TrustedBlock[] | null {
  const parsed = parseUiSpecDocument(body)
  if (!parsed.ok) return null
  return parsed.blocks
}

export function createConfirmationStore(deps: ConfirmationStoreDeps) {
  const entries = new Map<string, ConfirmationEntry>()
  const listeners = new Set<() => void>()
  const inFlight = new Set<string>()
  let version = 0

  function notify(): void {
    version += 1
    for (const listener of listeners) listener()
  }

  function getSnapshot(): number {
    return version
  }

  function get(token: string): ConfirmationEntry | undefined {
    return entries.get(token)
  }

  function getAll(): readonly ConfirmationEntry[] {
    return [...entries.values()]
  }

  function viewFor(token: string): ConfirmationView | null {
    const entry = entries.get(token)
    if (!entry) return null
    return toConfirmationView(
      entry.status,
      entry.prompt.expires_at,
      deps.getServerNowMs(),
      entry.message,
      entry.nextBlocks,
    )
  }

  function supersedeOlder(
    userId: string,
    action: ConfirmationPromptBlock['action'],
    keepToken: string,
  ): void {
    for (const entry of entries.values()) {
      if (entry.token === keepToken) continue
      if (entry.userId !== userId) continue
      if (entry.prompt.action !== action) continue
      if (
        entry.status === 'LIVE' ||
        entry.status === 'CONFIRMING' ||
        entry.status === 'RECONCILING'
      ) {
        entry.status = 'SUPERSEDED'
        entry.message = 'Replaced by a newer confirmation'
      }
    }
  }

  function register(userId: string, prompt: ConfirmationPromptBlock): void {
    const existing = entries.get(prompt.confirm_token)
    if (existing) {
      if (existing.status === 'DONE' || existing.status === 'REJECTED') return
      existing.prompt = prompt
      existing.userId = userId
      notify()
      return
    }

    supersedeOlder(userId, prompt.action, prompt.confirm_token)

    entries.set(prompt.confirm_token, {
      token: prompt.confirm_token,
      userId,
      prompt,
      status: 'LIVE',
      message: null,
      nextBlocks: null,
      result: null,
    })

    tick()
    notify()
  }

  function tick(): void {
    const now = deps.getServerNowMs()
    let changed = false
    let hasLive = false
    for (const entry of entries.values()) {
      if (entry.status !== 'LIVE') continue
      hasLive = true
      if (isExpiredAt(entry.prompt.expires_at, now)) {
        entry.status = 'EXPIRED'
        entry.message = 'This confirmation expired'
        changed = true
      }
    }
    if (changed || hasLive) notify()
  }

  function clearUser(userId: string): void {
    let changed = false
    for (const entry of entries.values()) {
      if (entry.userId !== userId) continue
      if (
        entry.status === 'LIVE' ||
        entry.status === 'CONFIRMING' ||
        entry.status === 'RECONCILING'
      ) {
        entry.status = 'SUPERSEDED'
        entry.message = 'Cleared because the user changed'
        inFlight.delete(entry.token)
        changed = true
      }
    }
    if (changed) notify()
  }

  function applyExecuteResponse(
    entry: ConfirmationEntry,
    response: ExecuteResponse,
  ): void {
    const code = extractErrorCode(response.body)
    const nextStatus = statusAfterExecuteHttp(response.httpStatus, code)
    entry.status = nextStatus
    entry.nextBlocks = parseNextBlocks(response.body)
    if (nextStatus === 'DONE') {
      entry.result = response.body
      entry.message = null
      deps.onDone?.(entry)
    } else if (nextStatus === 'EXPIRED') {
      entry.message = 'This confirmation expired'
    } else if (nextStatus === 'SUPERSEDED') {
      entry.message = 'Replaced by a newer confirmation'
    } else {
      entry.message = code ?? 'Confirmation was rejected'
    }
    registerFollowUpPrompts(entry.userId, entry.nextBlocks)
  }

  function registerFollowUpPrompts(
    userId: string,
    blocks: TrustedBlock[] | null,
  ): void {
    if (!blocks) return
    for (const block of blocks) {
      if (block.type === 'confirmation_prompt') {
        register(userId, block)
      }
    }
  }

  function applyStatusOutcome(
    entry: ConfirmationEntry,
    outcome: StatusOutcomeInput,
  ): void {
    entry.status = statusAfterReconcile(outcome.state)
    if (outcome.state === 'used') {
      entry.result = outcome.result ?? null
      if (outcome.result !== undefined) {
        entry.nextBlocks = parseNextBlocks(outcome.result)
      }
      entry.message = null
      registerFollowUpPrompts(entry.userId, entry.nextBlocks)
      deps.onDone?.(entry)
    } else if (outcome.state === 'expired') {
      entry.message = 'This confirmation expired'
    } else if (outcome.state === 'superseded' || outcome.state === 'void') {
      entry.message = 'Replaced by a newer confirmation'
    } else if (outcome.state === 'invalid') {
      entry.message = 'Confirmation could not be verified'
    } else {
      entry.message = null
    }
  }

  async function reconcile(entry: ConfirmationEntry): Promise<void> {
    entry.status = 'RECONCILING'
    notify()
    try {
      const status = await deps.getStatus(entry.token)
      applyStatusOutcome(entry, status)
    } catch {
      entry.status = 'RECONCILING'
      entry.message = 'Outcome unknown — retrying status…'
    }
    notify()
  }

  async function confirm(token: string): Promise<void> {
    tick()

    const entry = entries.get(token)
    if (!entry) return

    if (inFlight.has(token) || entry.status === 'CONFIRMING') return

    if (
      !canStartConfirm(
        entry.status,
        entry.prompt.expires_at,
        deps.getServerNowMs(),
      )
    ) {
      if (
        entry.status === 'LIVE' &&
        isExpiredAt(entry.prompt.expires_at, deps.getServerNowMs())
      ) {
        entry.status = 'EXPIRED'
        entry.message = 'This confirmation expired'
        notify()
      }
      return
    }

    inFlight.add(token)
    entry.status = 'CONFIRMING'
    notify()

    try {
      const response = await deps.execute({
        user_id: entry.userId,
        action: entry.prompt.action,
        params: entry.prompt.params,
        confirm_token: entry.prompt.confirm_token,
      })
      applyExecuteResponse(entry, response)
      notify()
    } catch (error) {
      if (deps.isTransportError(error)) {
        await reconcile(entry)
      } else {
        entry.status = 'REJECTED'
        entry.message =
          error instanceof Error ? error.message : 'Confirmation failed'
        notify()
      }
    } finally {
      inFlight.delete(token)
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    get,
    getAll,
    getSnapshot,
    viewFor,
    register,
    confirm,
    tick,
    clearUser,
    subscribe,
    isInFlight(token: string): boolean {
      return inFlight.has(token)
    },
  }
}

export type ConfirmationStore = ReturnType<typeof createConfirmationStore>
