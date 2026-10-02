let anchorServerMs: number | null = null
let anchorPerfMs: number | null = null

export function syncServerClock(iso: string): void {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return
  anchorServerMs = parsed
  anchorPerfMs = performance.now()
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
  return new Date(ms + 3 * 3600_000).toISOString().slice(0, 10)
}

export function resetServerClockForTests(): void {
  anchorServerMs = null
  anchorPerfMs = null
}
