import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCart, getOrders, getUser } from '@/infrastructure/api'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { useCallback } from 'react'
import { shellKeys } from './queryKeys'

export function useShellUser() {
  const { userId } = useCurrentUser()
  return useQuery({
    queryKey: shellKeys.user(userId),
    queryFn: ({ signal }) => getUser(userId, signal),
  })
}

export function useShellCart() {
  const { userId } = useCurrentUser()
  return useQuery({
    queryKey: shellKeys.cart(userId),
    queryFn: ({ signal }) => getCart(userId, signal),
  })
}

export function useShellOrders() {
  const { userId } = useCurrentUser()
  return useQuery({
    queryKey: shellKeys.orders(userId),
    queryFn: ({ signal }) => getOrders(userId, signal),
  })
}

export function useInvalidateShell() {
  const queryClient = useQueryClient()
  return useCallback(
    (userId: string) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: shellKeys.user(userId) }),
        queryClient.invalidateQueries({ queryKey: shellKeys.cart(userId) }),
        queryClient.invalidateQueries({ queryKey: shellKeys.orders(userId) }),
      ]),
    [queryClient],
  )
}
