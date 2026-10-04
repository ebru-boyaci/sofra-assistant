import type { UserDetail, UserSummary } from '@/infrastructure/api'
import { PERSONA_HINTS } from '@/shared/users'

type Source<T> = { data: T | undefined; isPending: boolean }

export type Persona =
  | { kind: 'ready'; name: string; meta: string }
  | { kind: 'loading' }
  | { kind: 'unresolved'; id: string; meta: string }

export function personaMeta(user: Pick<UserSummary, 'id' | 'district'>): string {
  return PERSONA_HINTS[user.id] ?? user.district
}

export function resolvePersona(
  userId: string,
  detail: Source<UserDetail>,
  list: Source<UserSummary[]>,
): Persona {
  const fromDetail = detail.data?.id === userId ? detail.data : undefined
  const fromList = list.data?.find((u) => u.id === userId)
  const user = fromDetail ?? fromList
  if (user) return { kind: 'ready', name: user.display_name, meta: personaMeta(user) }
  if (detail.isPending || list.isPending) return { kind: 'loading' }
  return { kind: 'unresolved', id: userId, meta: PERSONA_HINTS[userId] ?? '' }
}
