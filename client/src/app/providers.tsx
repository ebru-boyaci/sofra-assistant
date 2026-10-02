import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ConfirmationProvider } from '@/features/confirmation'
import { UserProvider } from '@/shared/UserProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ConfirmationProvider>{children}</ConfirmationProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}
