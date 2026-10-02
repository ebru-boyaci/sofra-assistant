import { describe, expect, it } from 'vitest'
import { shellKeys } from './queryKeys'

describe('shellKeys', () => {
  it('scopes queries per user', () => {
    expect(shellKeys.user('u_ok')).toEqual(['shell', 'user', 'u_ok'])
    expect(shellKeys.cart('u_ok')).toEqual(['shell', 'cart', 'u_ok'])
    expect(shellKeys.orders('u_lowbalance')).toEqual([
      'shell',
      'orders',
      'u_lowbalance',
    ])
  })
})
