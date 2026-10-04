import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { shellKeys } from '@/features/shell/queryKeys'
import { UserProvider } from '@/shared/UserProvider'
import { DEFAULT_USER_ID } from '@/shared/users'
import { SEEDED_CART, SEEDED_USER } from './fixtures'

export function WorkbenchProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    })
    client.setQueryData(shellKeys.user(DEFAULT_USER_ID), SEEDED_USER)
    client.setQueryData(shellKeys.cart(DEFAULT_USER_ID), SEEDED_CART)
    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>{children}</UserProvider>
    </QueryClientProvider>
  )
}
