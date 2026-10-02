import { formatCountdown, remainingMsUntil } from '@/domain/clock'
import type { ConfirmationStatus, ConfirmationView } from './types'

export function isExpiredAt(
  expiresAt: string,
  serverNowMs: number | null,
): boolean {
  if (serverNowMs === null) return false
  const expiresMs = Date.parse(expiresAt)
  if (Number.isNaN(expiresMs)) return true
  return serverNowMs > expiresMs
}

export function canStartConfirm(
  status: ConfirmationStatus,
  expiresAt: string,
  serverNowMs: number | null,
): boolean {
  if (status !== 'LIVE') return false
  if (serverNowMs === null) return false
  return !isExpiredAt(expiresAt, serverNowMs)
}

export function buttonLabelFor(status: ConfirmationStatus): string {
  switch (status) {
    case 'CONFIRMING':
      return 'Confirming…'
    case 'RECONCILING':
      return 'Checking…'
    case 'DONE':
      return 'Done'
    case 'EXPIRED':
      return 'Expired'
    case 'SUPERSEDED':
      return 'Replaced'
    case 'REJECTED':
      return 'Unavailable'
    case 'LIVE':
      return 'Confirm'
  }
}

export function toConfirmationView(
  status: ConfirmationStatus,
  expiresAt: string,
  serverNowMs: number | null,
  message: string | null,
  nextBlocks: ConfirmationView['nextBlocks'],
): ConfirmationView {
  const expired = status === 'EXPIRED' || isExpiredAt(expiresAt, serverNowMs)
  const canConfirm = canStartConfirm(status, expiresAt, serverNowMs)
  const remainingMs =
    status === 'LIVE' ? remainingMsUntil(expiresAt, serverNowMs) : null
  return {
    status,
    canConfirm,
    busy: status === 'CONFIRMING' || status === 'RECONCILING',
    expired: expired && status !== 'DONE',
    superseded: status === 'SUPERSEDED',
    message,
    nextBlocks,
    buttonLabel: buttonLabelFor(status),
    remainingMs,
    countdownLabel:
      remainingMs === null ? null : formatCountdown(remainingMs),
  }
}

export function statusAfterExecuteHttp(
  httpStatus: number,
  code: string | null,
): ConfirmationStatus {
  if (httpStatus >= 200 && httpStatus < 300) return 'DONE'
  if (httpStatus === 410 || code === 'token_expired') return 'EXPIRED'
  if (
    httpStatus === 409 &&
    (code === 'token_superseded' || code === 'token_void')
  ) {
    return 'SUPERSEDED'
  }
  if (httpStatus === 409 && code === 'token_used') return 'DONE'
  return 'REJECTED'
}

export function statusAfterReconcile(
  state: 'live' | 'expired' | 'used' | 'superseded' | 'void' | 'invalid',
): ConfirmationStatus {
  switch (state) {
    case 'used':
      return 'DONE'
    case 'expired':
      return 'EXPIRED'
    case 'superseded':
    case 'void':
      return 'SUPERSEDED'
    case 'live':
      return 'LIVE'
    case 'invalid':
      return 'REJECTED'
  }
}
