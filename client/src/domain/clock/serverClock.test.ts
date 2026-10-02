import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calendarDaysBetween,
  formatCountdown,
  formatRelativeDay,
  getServerNowMs,
  getServerTodayIstanbul,
  hasServerClock,
  remainingMsUntil,
  resetServerClockForTests,
  syncServerClock,
} from './serverClock'

afterEach(() => {
  resetServerClockForTests()
  vi.useRealTimers()
})

describe('server clock', () => {
  it('starts unsynced', () => {
    expect(hasServerClock()).toBe(false)
    expect(getServerNowMs()).toBeNull()
    expect(getServerTodayIstanbul()).toBeNull()
  })

  it('stores server_now and advances with local drift', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T09:00:00.000Z'))
    syncServerClock('2026-08-20T09:00:00.000Z')

    const atSync = getServerNowMs()
    expect(atSync).toBe(Date.parse('2026-08-20T09:00:00.000Z'))

    vi.advanceTimersByTime(2500)
    const drifted = getServerNowMs()
    expect(drifted).toBe(Date.parse('2026-08-20T09:00:02.500Z'))
  })

  it('resync replaces the anchor', () => {
    vi.useFakeTimers()
    syncServerClock('2026-08-20T09:00:00.000Z')
    vi.advanceTimersByTime(10_000)
    syncServerClock('2026-08-20T10:00:00.000Z')
    expect(getServerNowMs()).toBe(Date.parse('2026-08-20T10:00:00.000Z'))
  })

  it('Europe/Istanbul today from UTC server_now', () => {
    syncServerClock('2026-08-20T21:30:00.000Z')
    expect(getServerTodayIstanbul()).toBe('2026-08-21')

    syncServerClock('2026-08-20T20:59:00.000Z')
    expect(getServerTodayIstanbul()).toBe('2026-08-20')
  })

  it('remainingMsUntil and formatCountdown', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T09:00:00.000Z'))
    syncServerClock('2026-08-20T09:00:00.000Z')
    const remaining = remainingMsUntil('2026-08-20T09:05:00.000Z')
    expect(remaining).toBe(5 * 60_000)
    expect(formatCountdown(remaining!)).toBe('5:00')
    expect(formatCountdown(61_000)).toBe('1:01')
    expect(formatCountdown(0)).toBe('0:00')
  })

  it('remainingMsUntil is null without a synced clock', () => {
    expect(remainingMsUntil('2026-08-20T09:05:00.000Z')).toBeNull()
  })
})

describe('relative calendar days', () => {
  it('computes day deltas on YYYY-MM-DD', () => {
    expect(calendarDaysBetween('2026-08-18', '2026-08-20')).toBe(2)
    expect(calendarDaysBetween('2026-08-20', '2026-08-20')).toBe(0)
  })

  it('formats today / yesterday / N days ago against server today', () => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    expect(getServerTodayIstanbul()).toBe('2026-08-20')
    expect(formatRelativeDay('2026-08-20')).toBe('today')
    expect(formatRelativeDay('2026-08-19')).toBe('yesterday')
    expect(formatRelativeDay('2026-07-10')).toBe('41 days ago')
    expect(formatRelativeDay('2026-08-21')).toBe('2026-08-21')
  })

  it('falls back to raw date when clock is missing', () => {
    expect(formatRelativeDay('2026-08-20')).toBe('2026-08-20')
  })
})
