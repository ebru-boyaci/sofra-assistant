export type UserSummary = {
  id: string
  display_name: string
  district: string
}

export type UserDetail = {
  id: string
  display_name: string
  wallet_balance_try: number
  payment_method: boolean
  age_verified: boolean
  address: string
  district: string
}

export type CartItem = {
  item_id: string
  qty: number
  name: string
  price_try: number
}

export type CartQuote = {
  subtotal_try: number
  delivery_fee_try: number
  total_try: number
  min_order_try: number
  meets_minimum: boolean
  sufficient_funds: boolean
}

export type CartResponse = {
  restaurant_id: string | null
  restaurant_name: string | null
  items: CartItem[]
  quote: CartQuote | null
}

export type OrderListItem = {
  order_id: string
  date: string
  restaurant: string
  total_try: number
  status: string
  note: string
  tips_try: number
}

export type ActionStatusState =
  | 'live'
  | 'expired'
  | 'used'
  | 'superseded'
  | 'void'
  | 'invalid'

export type ActionStatusResponse = {
  state: ActionStatusState
  action?: string
  expires_at?: string
  executed_at?: string
  result?: unknown
}

export type ExecuteRequest = {
  user_id: string
  action: string
  params: unknown
  confirm_token: string
}

export type ExecuteResponse = {
  httpStatus: number
  body: unknown
}

export type KbDocument = {
  id: string
  title: string
  body: string
  category: string
  tags: string[]
  date: string | null
}

export type KbSearchHit = {
  id: string
  title: string
  category: string
  date: string | null
  tags: string[]
  snippet: string
  score: number
}

export type KbSearchResponse = {
  total: number
  offset: number
  results: KbSearchHit[]
}
