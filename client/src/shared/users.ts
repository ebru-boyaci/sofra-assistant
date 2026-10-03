export const MOCK_USERS = [
  { id: 'u_ok', name: 'Deniz Yılmaz', role: 'Standard' },
  { id: 'u_unverified', name: 'Mert Demir', role: 'Age unverified' },
  { id: 'u_lowbalance', name: 'Ece Kaya', role: 'Low balance' },
  { id: 'u_new', name: 'Zeynep Aydın', role: 'New user' },
] as const

export type UserId = (typeof MOCK_USERS)[number]['id']

export const DEFAULT_USER_ID: UserId = 'u_ok'
