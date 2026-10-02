let anchorServerMs: number | null = null
let anchorPerfMs: number | null = null

const istanbulDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function syncServerClock(iso: string): void {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return
  anchorServerMs = parsed
  anchorPerfMs = performance.now()
}

export function hasServerClock(): boolean {
  return anchorServerMs !== null && anchorPerfMs !== null
}

export function getServerNowMs(): number | null {
  if (anchorServerMs === null || anchorPerfMs === null) return null
  return anchorServerMs + (performance.now() - anchorPerfMs)
}

export function getServerNowIso(): string | null {
  const ms = getServerNowMs()
  return ms === null ? null : new Date(ms).toISOString()
}

export function getServerTodayIstanbul(): string | null {
  const ms = getServerNowMs()
  if (ms === null) return null
  return istanbulDayFormatter.format(new Date(ms))
}

export function remainingMsUntil(
  expiresAt: string,
  serverNowMs: number | null = getServerNowMs(),
): number | null {
  if (serverNowMs === null) return null
  const expiresMs = Date.parse(expiresAt)
  if (Number.isNaN(expiresMs)) return null
  return Math.max(0, expiresMs - serverNowMs)
}

export function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function calendarDaysBetween(fromYmd: string, toYmd: string): number | null {
  const fromMs = Date.parse(`${fromYmd}T12:00:00Z`)
  const toMs = Date.parse(`${toYmd}T12:00:00Z`)
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return null
  return Math.round((toMs - fromMs) / 86_400_000)
}

export function formatRelativeDay(
  dateYmd: string,
  todayYmd: string | null = getServerTodayIstanbul(),
): string {
  if (todayYmd === null) return dateYmd
  const daysAgo = calendarDaysBetween(dateYmd, todayYmd)
  if (daysAgo === null) return dateYmd
  if (daysAgo === 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  if (daysAgo > 1) return `${daysAgo} days ago`
  return dateYmd
}

export function resetServerClockForTests(): void {
  anchorServerMs = null
  anchorPerfMs = null
}
