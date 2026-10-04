import { describe, expect, it } from 'vitest'
import type { KbDocument } from '@/infrastructure/api'
import { kbTrustBadge, kbTrustHint } from './trustHint'

function doc(partial: Partial<KbDocument> & Pick<KbDocument, 'id' | 'title'>): KbDocument {
  return {
    body: 'body',
    category: 'policy',
    tags: [],
    date: '2026-06-01',
    ...partial,
  }
}

describe('kbTrustHint', () => {
  it('flags archive tag and legacy title', () => {
    expect(
      kbTrustHint(doc({ id: 'x', title: 'Fee', tags: ['archive'] })),
    ).toMatch(/archived/i)
    expect(
      kbTrustHint(doc({ id: 'x', title: 'Fee (legacy)' })),
    ).toMatch(/archived/i)
    expect(
      kbTrustHint(doc({ id: 'pol_fee_old', title: 'Fee' })),
    ).toMatch(/archived/i)
  })

  it('flags missing date', () => {
    expect(kbTrustHint(doc({ id: 'faq_1', title: 'FAQ', date: null }))).toMatch(
      /no date/i,
    )
  })

  it('returns null for a current dated policy', () => {
    expect(
      kbTrustHint(
        doc({
          id: 'pol_delivery_fee_v2',
          title: 'Delivery fee (current)',
          date: '2026-06-01',
          tags: ['delivery'],
        }),
      ),
    ).toBeNull()
  })

  it('maps hints to short badges', () => {
    expect(
      kbTrustBadge(doc({ id: 'x', title: 'Fee', tags: ['archive'] })),
    ).toBe('Archived')
    expect(kbTrustBadge(doc({ id: 'faq', title: 'FAQ', date: null }))).toBe(
      'Undated',
    )
  })
})
