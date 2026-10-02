import { useContext, useSyncExternalStore } from 'react'
import type {
  ConfirmationStore,
  ConfirmationView,
} from '@/domain/confirmation'
import type { ConfirmationPromptBlock } from '@/domain/ui-spec'
import { ConfirmationContext } from './confirmation-context'

function useConfirmationStore(): ConfirmationStore {
  const store = useContext(ConfirmationContext)
  if (!store) {
    throw new Error('useConfirmationStore requires ConfirmationProvider')
  }
  return store
}

export function useConfirmationStoreOptional(): ConfirmationStore | null {
  return useContext(ConfirmationContext)
}

export function useConfirmation(): {
  store: ConfirmationStore
  register: (userId: string, prompt: ConfirmationPromptBlock) => void
  confirm: (token: string) => Promise<void>
  viewFor: (token: string) => ConfirmationView | null
} {
  const store = useConfirmationStore()
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  return {
    store,
    register: store.register,
    confirm: store.confirm,
    viewFor: store.viewFor,
  }
}

export function useConfirmationView(
  token: string | undefined,
): ConfirmationView | null {
  const store = useConfirmationStoreOptional()
  useSyncExternalStore(
    store?.subscribe ?? emptySubscribe,
    store?.getSnapshot ?? zeroSnapshot,
    zeroSnapshot,
  )
  if (!store || !token) return null
  return store.viewFor(token)
}

function emptySubscribe(): () => void {
  return () => {}
}

function zeroSnapshot(): number {
  return 0
}
