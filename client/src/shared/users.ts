export type UserId = string

export const DEFAULT_USER_ID: UserId = 'u_ok'

export const PERSONA_HINTS: Readonly<Record<string, string>> = {
  u_ok: 'Standard',
  u_unverified: 'Age unverified',
  u_lowbalance: 'Low balance',
  u_new: 'New user',
}
