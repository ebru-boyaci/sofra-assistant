import { describe, expect, it } from 'vitest'
import type { UserDetail, UserSummary } from '@/infrastructure/api'
import { resolvePersona } from './resolvePersona'

const detail: UserDetail = {
  id: 'u_ok',
  display_name: 'Deniz Yılmaz',
  wallet_balance_try: 800,
  payment_method: true,
  age_verified: true,
  address: 'Moda Cd. 1',
  district: 'Kadıköy',
}

const list: UserSummary[] = [
  { id: 'u_ok', display_name: 'Deniz Yılmaz', district: 'Kadıköy' },
  { id: 'u_new', display_name: 'Zeynep Aydın', district: 'Üsküdar' },
]

const pending = { data: undefined, isPending: true }
const failed = { data: undefined, isPending: false }

describe('resolvePersona', () => {
  it('uses the user detail the header already fetched, before the list arrives', () => {
    expect(resolvePersona('u_ok', { data: detail, isPending: false }, pending)).toEqual({
      kind: 'ready',
      name: 'Deniz Yılmaz',
      meta: 'Standard',
    })
  })

  it('uses the list right after a switch, while the new detail is loading', () => {
    expect(resolvePersona('u_new', { data: detail, isPending: true }, { data: list, isPending: false })).toEqual({
      kind: 'ready',
      name: 'Zeynep Aydın',
      meta: 'New user',
    })
  })

  it('never shows the raw id while either read is still pending', () => {
    expect(resolvePersona('u_ok', pending, pending)).toEqual({ kind: 'loading' })
    expect(resolvePersona('u_ok', failed, pending)).toEqual({ kind: 'loading' })
  })

  it('falls back to the id only when both reads have failed', () => {
    expect(resolvePersona('u_ok', failed, failed)).toEqual({
      kind: 'unresolved',
      id: 'u_ok',
      meta: 'Standard',
    })
  })

  it('falls back to the server district for users without a persona hint', () => {
    const extra = [{ id: 'u_x', display_name: 'Ada', district: 'Beyoğlu' }]
    expect(resolvePersona('u_x', failed, { data: extra, isPending: false })).toEqual({
      kind: 'ready',
      name: 'Ada',
      meta: 'Beyoğlu',
    })
  })
})
