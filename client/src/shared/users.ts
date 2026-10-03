export const MOCK_USERS = [
  { id: 'u_ok', label: 'Deniz Yılmaz — standard' },
  { id: 'u_unverified', label: 'Mert Demir — age unverified' },
  { id: 'u_lowbalance', label: 'Ece Kaya — low balance' },
  { id: 'u_new', label: 'Zeynep Aydın — new user' },
] as const

export type UserId = (typeof MOCK_USERS)[number]['id']

export const DEFAULT_USER_ID: UserId = 'u_ok'
