import { buttonLabelFor, type ConfirmationStatus, type ConfirmationView } from '@/domain/confirmation'
import type {
  CartSummaryBlock,
  ConfirmationPromptBlock,
  MenuItemBlock,
  OrderSummaryBlock,
  RestaurantCardBlock,
  TrustedBlock,
  VerificationGateBlock,
} from '@/domain/ui-spec'
import type { CartResponse, UserDetail } from '@/infrastructure/api/types'

export const SEEDED_USER: UserDetail = {
  id: 'u_ok',
  display_name: 'Deniz Yılmaz',
  wallet_balance_try: 800,
  payment_method: true,
  age_verified: true,
  address: 'Moda Cd. No:12',
  district: 'Kadıköy',
}

export const SEEDED_CART: CartResponse = {
  restaurant_id: 'rst_04',
  restaurant_name: 'Burger Stop',
  items: [{ item_id: 'itm_cheese', qty: 2, name: 'Cheeseburger', price_try: 195 }],
  quote: {
    subtotal_try: 390,
    delivery_fee_try: 0,
    total_try: 390,
    min_order_try: 150,
    meets_minimum: true,
    sufficient_funds: true,
  },
}

export const restaurantFull: RestaurantCardBlock = {
  type: 'restaurant_card',
  restaurant_id: 'rst_04',
  name: 'Burger Stop',
  cuisine: 'Burger',
  rating: 4.6,
  delivery_fee_try: 29.9,
  min_order_try: 150,
  eta_min: 25,
  district: 'Kadıköy',
}

export const restaurantSparse: RestaurantCardBlock = {
  type: 'restaurant_card',
  restaurant_id: 'rst_sparse',
  name: 'Köfteci Ramiz',
}

export const menuAvailable: MenuItemBlock = {
  type: 'menu_item',
  item_id: 'itm_cheese',
  name: 'Cheeseburger',
  price_try: 195,
  available: true,
  age_restricted: false,
  category: 'burgers',
}

export const menuUnavailable: MenuItemBlock = {
  type: 'menu_item',
  item_id: 'itm_kune',
  name: 'Künefe',
  price_try: 180,
  available: false,
  age_restricted: false,
  category: 'dessert',
}

export const menuAgeRestricted: MenuItemBlock = {
  type: 'menu_item',
  item_id: 'itm_energy',
  name: 'Energy drink',
  price_try: 75,
  available: true,
  age_restricted: true,
  category: 'drinks',
}

export const menuUnavailableAndRestricted: MenuItemBlock = {
  type: 'menu_item',
  item_id: 'itm_beer',
  name: 'Draft beer',
  price_try: 120,
  available: false,
  age_restricted: true,
  category: 'drinks',
}

export const cartFreeDelivery: CartSummaryBlock = {
  type: 'cart_summary',
  restaurant_id: 'rst_04',
  items: [{ name: 'Cheeseburger', qty: 2, price_try: 195 }],
  subtotal_try: 390,
  delivery_fee_try: 0,
  total_try: 390,
  min_order_try: 150,
  meets_minimum: true,
}

export const cartPaidDelivery: CartSummaryBlock = {
  type: 'cart_summary',
  restaurant_id: 'rst_02',
  items: [{ name: 'Margherita', qty: 1, price_try: 220 }],
  subtotal_try: 220,
  delivery_fee_try: 24.9,
  total_try: 244.9,
  min_order_try: 120,
  meets_minimum: true,
}

export const cartBelowMinimum: CartSummaryBlock = {
  type: 'cart_summary',
  restaurant_id: 'rst_04',
  items: [{ name: 'Fries', qty: 1, price_try: 70 }],
  subtotal_try: 70,
  delivery_fee_try: 29.9,
  total_try: 99.9,
  min_order_try: 150,
  meets_minimum: false,
}

export const orderReceived: OrderSummaryBlock = {
  type: 'order_summary',
  order_id: 'u_ok_o9',
  restaurant: 'Burger Stop',
  total_try: 390,
  status: 'received',
  eta_min: 25,
  date: '2026-08-20',
}

export const orderDelivered: OrderSummaryBlock = {
  type: 'order_summary',
  order_id: 'u_ok_o1',
  restaurant: 'Burger Stop',
  total_try: 390,
  status: 'delivered',
  date: '2026-08-19',
}

export const orderCancelled: OrderSummaryBlock = {
  type: 'order_summary',
  order_id: 'u_ok_o3',
  restaurant: 'Napoli Fırın',
  total_try: 210,
  status: 'cancelled',
  date: '2026-07-10',
  note: 'Leave it at the door <script>alert(1)</script>',
}

export const placeOrderPrompt: ConfirmationPromptBlock = {
  type: 'confirmation_prompt',
  action: 'place_order',
  summary: '2 cheeseburgers from Burger Stop, 390 TL, free delivery',
  params: { restaurant_id: 'rst_04', total_try: 390 },
  confirm_token: 'tok_place',
  expires_at: '2026-08-20T12:05:00+03:00',
}

export const cancelPrompt: ConfirmationPromptBlock = {
  type: 'confirmation_prompt',
  action: 'cancel_order',
  summary: 'Cancel order u_ok_o1 from Burger Stop',
  params: { order_id: 'u_ok_o1' },
  confirm_token: 'tok_cancel',
  expires_at: '2026-08-20T12:05:00+03:00',
}

export const tipPrompt: ConfirmationPromptBlock = {
  type: 'confirmation_prompt',
  action: 'add_tip',
  summary: 'Leave the courier a 50 TL tip on u_ok_o1',
  params: { order_id: 'u_ok_o1', amount_try: 50, total_try: 50 },
  confirm_token: 'tok_tip',
  expires_at: '2026-08-20T12:05:00+03:00',
}

const GATE_COPY: Record<
  VerificationGateBlock['requirement'],
  { reason: string; cta: string }
> = {
  out_of_service_area: {
    reason: 'This restaurant does not deliver to your address.',
    cta: 'Try a restaurant in Kadıköy.',
  },
  item_unavailable: {
    reason: 'Künefe is not available right now.',
    cta: 'Pick another item.',
  },
  age_18_plus: {
    reason: 'This item is 18+ and the account is not age-verified.',
    cta: 'Verify your age, or choose something else.',
  },
  min_order: {
    reason: 'The cart is below the restaurant minimum.',
    cta: 'Add more items to reach the minimum.',
  },
  sufficient_funds: {
    reason: 'The wallet balance does not cover this order.',
    cta: 'Add funds, or reduce the cart.',
  },
  not_cancellable: {
    reason: 'This order can no longer be cancelled.',
    cta: 'Track the order instead.',
  },
  tip_window_expired: {
    reason: 'The order was delivered on 2026-07-10, outside the 7-day tip window.',
    cta: 'Tips are closed for this order.',
  },
}

export const verificationGates: VerificationGateBlock[] = (
  Object.keys(GATE_COPY) as VerificationGateBlock['requirement'][]
).map((requirement) => ({
  type: 'verification_gate',
  requirement,
  reason: GATE_COPY[requirement].reason,
  cta: GATE_COPY[requirement].cta,
}))

export function confirmationView(
  status: ConfirmationStatus,
  message: string | null = null,
  nextBlocks: TrustedBlock[] | null = null,
): ConfirmationView {
  return {
    status,
    canConfirm: status === 'LIVE',
    busy: status === 'CONFIRMING' || status === 'RECONCILING',
    expired: status === 'EXPIRED',
    superseded: status === 'SUPERSEDED',
    message,
    nextBlocks,
    buttonLabel: buttonLabelFor(status),
    remainingMs: status === 'LIVE' ? 272_000 : null,
    countdownLabel: status === 'LIVE' ? '4:32' : null,
  }
}
