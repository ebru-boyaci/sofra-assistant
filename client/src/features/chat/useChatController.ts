import { useConfirmation } from '@/features/confirmation'
import { ApiError, streamChat, TransportError } from '@/infrastructure/api'
import { createStreamSession } from '@/infrastructure/streaming'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  nextTurnId,
  parseAssemblyAudit,
  parseAssemblyBlocks,
  registerPromptsFromBlocks,
  statusFromAssembly,
} from './chatHelpers'
import type {
  AssistantTurn,
  ChatSessionValue,
  ChatTransportPhase,
  ChatTurn,
} from './chatTypes'

export function useChatController(): ChatSessionValue {
  const { userId, conversationId, setConversationId } = useCurrentUser()
  const { register, confirm, viewFor } = useConfirmation()

  const sessionRef = useRef(createStreamSession())
  const abortRef = useRef<AbortController | null>(null)
  const activeAssistantIdRef = useRef<string | null>(null)
  const lastUserMessageRef = useRef<string | null>(null)

  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [phase, setPhase] = useState<ChatTransportPhase>('idle')
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(0)

  const isBusy = phase === 'loading' || phase === 'streaming'
  const rateLimited =
    rateLimitedUntil != null && nowMs > 0 && nowMs < rateLimitedUntil
  const rateLimitedSeconds = rateLimited
    ? Math.max(1, Math.ceil((rateLimitedUntil! - nowMs) / 1000))
    : null

  useEffect(() => {
    if (rateLimitedUntil == null) return
    const id = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [rateLimitedUntil])

  useEffect(() => {
    if (rateLimitedUntil == null || nowMs === 0) return
    if (nowMs < rateLimitedUntil) return
    setPhase((prev) => (prev === 'rate_limited' ? 'idle' : prev))
  }, [nowMs, rateLimitedUntil])

  const patchAssistant = useCallback(
    (id: string, patch: Partial<AssistantTurn>) => {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.role === 'assistant' && turn.id === id
            ? { ...turn, ...patch }
            : turn,
        ),
      )
    },
    [],
  )

  const stop = useCallback(() => {
    const assistantId = activeAssistantIdRef.current
    abortRef.current?.abort()
    abortRef.current = null
    sessionRef.current.abort()
    activeAssistantIdRef.current = null
    if (assistantId) {
      patchAssistant(assistantId, {
        status: 'stopped',
        message: 'Stopped',
        retryable: false,
      })
    }
    setPhase('stopped')
  }, [patchAssistant])

  const runStream = useCallback(
    async (message: string, assistantId: string) => {
      const controller = new AbortController()
      abortRef.current = controller
      activeAssistantIdRef.current = assistantId
      setPhase('loading')
      patchAssistant(assistantId, {
        status: 'loading',
        message: null,
        retryable: false,
        retryAfterSeconds: null,
      })

      try {
        const final = await streamChat({
          userId,
          message,
          conversationId,
          session: sessionRef.current,
          signal: controller.signal,
          onUpdate: (snap) => {
            if (activeAssistantIdRef.current !== assistantId) return
            if (snap.conversationId) {
              setConversationId(snap.conversationId)
            }
            const parsed = parseAssemblyBlocks(snap)
            registerPromptsFromBlocks(userId, parsed.blocks, register)
            const status = statusFromAssembly(snap, false)
            patchAssistant(assistantId, {
              status: status === 'streaming' ? 'streaming' : status,
              blocks: parsed.blocks,
              failures: parsed.failures,
              audit: parseAssemblyAudit(snap),
              rejectedConfirmation: parsed.rejectedConfirmation,
              requestId: snap.requestId,
              message:
                snap.error?.message ??
                (status === 'unsupported_version'
                  ? 'This response version is not supported.'
                  : null),
              retryable: snap.error?.retryable ?? false,
            })
            if (status === 'streaming' || status === 'loading') {
              setPhase('streaming')
            }
          },
        })

        if (activeAssistantIdRef.current !== assistantId) return

        if (final.conversationId) {
          setConversationId(final.conversationId)
        }

        const parsed = parseAssemblyBlocks(final)
        registerPromptsFromBlocks(userId, parsed.blocks, register)
        const stopped = controller.signal.aborted
        const status = statusFromAssembly(final, stopped)
        patchAssistant(assistantId, {
          status,
          blocks: parsed.blocks,
          failures: parsed.failures,
          audit: parseAssemblyAudit(final),
          rejectedConfirmation: parsed.rejectedConfirmation,
          requestId: final.requestId,
          message:
            final.error?.message ??
            (status === 'unsupported_version'
              ? 'This response version is not supported.'
              : status === 'incomplete'
                ? 'Response ended before it finished.'
                : status === 'stopped'
                  ? 'Stopped'
                  : null),
          retryable: final.error?.retryable ?? status === 'incomplete',
        })
        setPhase(status)
        activeAssistantIdRef.current = null
        abortRef.current = null
      } catch (error) {
        if (activeAssistantIdRef.current !== assistantId) return

        if (controller.signal.aborted) {
          patchAssistant(assistantId, {
            status: 'stopped',
            message: 'Stopped',
            retryable: false,
          })
          setPhase('stopped')
          activeAssistantIdRef.current = null
          abortRef.current = null
          return
        }

        if (error instanceof ApiError && error.isRateLimited) {
          const seconds = error.retryAfterSeconds ?? 3
          const now = Date.now()
          setNowMs(now)
          setRateLimitedUntil(now + seconds * 1000)
          patchAssistant(assistantId, {
            status: 'rate_limited',
            message: error.message || 'Too many requests. Wait before retrying.',
            retryable: true,
            retryAfterSeconds: seconds,
          })
          setPhase('rate_limited')
        } else if (error instanceof ApiError && error.isRetryableHttp) {
          patchAssistant(assistantId, {
            status: 'error_retryable',
            message: error.message || 'Temporary server error.',
            retryable: true,
          })
          setPhase('error_retryable')
        } else if (error instanceof ApiError) {
          patchAssistant(assistantId, {
            status: 'error_final',
            message: error.message || 'Request failed.',
            retryable: false,
          })
          setPhase('error_final')
        } else if (error instanceof TransportError) {
          patchAssistant(assistantId, {
            status: 'error_retryable',
            message: error.message || 'Network error.',
            retryable: true,
          })
          setPhase('error_retryable')
        } else {
          patchAssistant(assistantId, {
            status: 'error_final',
            message:
              error instanceof Error ? error.message : 'Something went wrong.',
            retryable: false,
          })
          setPhase('error_final')
        }

        activeAssistantIdRef.current = null
        abortRef.current = null
      }
    },
    [
      conversationId,
      patchAssistant,
      register,
      setConversationId,
      userId,
    ],
  )

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim()
      if (!message) return
      if (rateLimited) return

      if (isBusy) {
        abortRef.current?.abort()
        abortRef.current = null
        sessionRef.current.abort()
        const supersededId = activeAssistantIdRef.current
        if (supersededId) {
          patchAssistant(supersededId, {
            status: 'stopped',
            message: 'Replaced by a newer message',
            retryable: false,
          })
        }
        activeAssistantIdRef.current = null
      }

      lastUserMessageRef.current = message
      const userTurnId = nextTurnId('user')
      const assistantId = nextTurnId('asst')

      setTurns((prev) => [
        ...prev,
        { id: userTurnId, role: 'user', text: message },
        {
          id: assistantId,
          role: 'assistant',
          status: 'loading',
          blocks: [],
          failures: [],
          audit: null,
          rejectedConfirmation: false,
          message: null,
          retryable: false,
          retryAfterSeconds: null,
          requestId: null,
        },
      ])

      await runStream(message, assistantId)
    },
    [isBusy, patchAssistant, rateLimited, runStream],
  )

  const retryLast = useCallback(async () => {
    const message = lastUserMessageRef.current
    if (!message || rateLimited) return
    await send(message)
  }, [rateLimited, send])

  const onConfirm = useCallback(
    (token: string) => {
      void confirm(token)
    },
    [confirm],
  )

  return {
    turns,
    phase,
    isBusy,
    rateLimited,
    rateLimitedUntil,
    rateLimitedSeconds,
    conversationId,
    send,
    stop,
    retryLast,
    onConfirm,
    viewFor,
  }
}
