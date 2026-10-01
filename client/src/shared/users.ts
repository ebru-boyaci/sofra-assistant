export const MOCK_USERS = [
  { id: 'u_ok', label: 'Deniz Yılmaz (u_ok)' },
  { id: 'u_unverified', label: 'Mert Demir (u_unverified)' },
  { id: 'u_lowbalance', label: 'Ece Kaya (u_lowbalance)' },
  { id: 'u_new', label: 'Zeynep Aydın (u_new)' },
] as const

export type UserId = (typeof MOCK_USERS)[number]['id']

export const DEFAULT_USER_ID: UserId = 'u_ok'
