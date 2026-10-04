import { describe, expect, it } from 'vitest'
import { confirmationOutcomeAnnouncement } from './confirmationAnnouncement'

describe('confirmationOutcomeAnnouncement', () => {
  it('announces place-order done', () => {
    expect(confirmationOutcomeAnnouncement('DONE', 'place_order')).toBe(
      'Confirmed. Your order was placed.',
    )
  })

  it('stays quiet while confirming', () => {
    expect(confirmationOutcomeAnnouncement('CONFIRMING', 'place_order')).toBeNull()
    expect(confirmationOutcomeAnnouncement('LIVE', 'place_order')).toBeNull()
  })

  it('announces expired and superseded', () => {
    expect(confirmationOutcomeAnnouncement('EXPIRED', 'place_order')).toBe(
      'Confirmation expired.',
    )
    expect(confirmationOutcomeAnnouncement('SUPERSEDED', 'place_order')).toBe(
      'Confirmation replaced by a newer one.',
    )
  })
})
