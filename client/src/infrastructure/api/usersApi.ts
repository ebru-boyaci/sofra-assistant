import { apiJson } from './http'
import type { CartResponse, OrderListItem, UserDetail, UserSummary } from './types'

export function listUsers(signal?: AbortSignal): Promise<UserSummary[]> {
  return apiJson<UserSummary[]>('/api/users', { signal })
}

export function getUser(userId: string, signal?: AbortSignal): Promise<UserDetail> {
  return apiJson<UserDetail>(`/api/users/${encodeURIComponent(userId)}`, { signal })
}

export function getCart(userId: string, signal?: AbortSignal): Promise<CartResponse> {
  return apiJson<CartResponse>(`/api/users/${encodeURIComponent(userId)}/cart`, {
    signal,
  })
}

export function getOrders(userId: string, signal?: AbortSignal): Promise<OrderListItem[]> {
  return apiJson<OrderListItem[]>(`/api/users/${encodeURIComponent(userId)}/orders`, {
    signal,
  })
}
