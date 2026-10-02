import { getServerNowMs } from '@/domain/clock'
import {
  createConfirmationStore,
  type ConfirmationStore,
} from '@/domain/confirmation'
import {
  executeAction,
  getActionStatus,
  TransportError,
} from '@/infrastructure/api'
import {
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { ConfirmationContext } from './confirmation-context'
import { useCurrentUser } from '@/shared/useCurrentUser'

type Props = {
  children: ReactNode
  store?: ConfirmationStore
}

export function ConfirmationProvider({ children, store: injected }: Props) {
  const { userId } = useCurrentUser()
  const previousUserRef = useRef(userId)

  const store = useMemo(
    () =>
      injected ??
      createConfirmationStore({
        getServerNowMs,
        execute: (input) =>
          executeAction({
            user_id: input.user_id,
            action: input.action,
            params: input.params,
            confirm_token: input.confirm_token,
          }),
        getStatus: getActionStatus,
        isTransportError: (error) => error instanceof TransportError,
      }),
    [injected],
  )

  useEffect(() => {
    const id = window.setInterval(() => store.tick(), 1000)
    return () => window.clearInterval(id)
  }, [store])

  useEffect(() => {
    if (previousUserRef.current !== userId) {
      store.clearUser(previousUserRef.current)
      previousUserRef.current = userId
    }
  }, [store, userId])

  return (
    <ConfirmationContext.Provider value={store}>
      {children}
    </ConfirmationContext.Provider>
  )
}
