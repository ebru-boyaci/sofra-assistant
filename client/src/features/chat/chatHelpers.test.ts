import { describe, expect, it } from 'vitest'
import { statusFromAssembly } from './chatHelpers'
import type { AssembledStream } from '@/infrastructure/streaming'

function snap(partial: Partial<AssembledStream>): AssembledStream {
  return {
    status: 'streaming',
    version: '1',
    requestId: 'rq_1',
    conversationId: 'cv_1',
    serverNow: '2026-08-20T09:00:00.000Z',
    blocks: [],
    audit: null,
    error: null,
    ...partial,
  }
}

describe('statusFromAssembly', () => {
  it('maps stream statuses for UX', () => {
    expect(statusFromAssembly(snap({ status: 'complete' }), false)).toBe(
      'complete',
    )
    expect(statusFromAssembly(snap({ status: 'incomplete' }), false)).toBe(
      'incomplete',
    )
    expect(
      statusFromAssembly(
        snap({
          status: 'error',
          error: { code: 'x', message: 'y', retryable: true },
        }),
        false,
      ),
    ).toBe('error_retryable')
    expect(
      statusFromAssembly(
        snap({
          status: 'error',
          error: { code: 'x', message: 'y', retryable: false },
        }),
        false,
      ),
    ).toBe('error_final')
    expect(statusFromAssembly(snap({ status: 'streaming' }), true)).toBe(
      'stopped',
    )
  })
})
