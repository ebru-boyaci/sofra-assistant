import { z } from 'zod'

const ParamsSchema = z.record(z.string(), z.unknown())

export const TextBlockSchema = z
  .object({
    type: z.literal('text'),
    markdown: z.string(),
  })
  .strict()

export const RestaurantCardSchema = z
  .object({
    type: z.literal('restaurant_card'),
    restaurant_id: z.string(),
    name: z.string(),
    cuisine: z.string().optional(),
    rating: z.number().optional(),
    delivery_fee_try: z.number().optional(),
    min_order_try: z.number().optional(),
    eta_min: z.int().optional(),
    district: z.string().optional(),
  })
  .strict()

export const MenuItemSchema = z
  .object({
    type: z.literal('menu_item'),
    item_id: z.string(),
    name: z.string(),
    price_try: z.number(),
    available: z.boolean(),
    age_restricted: z.boolean(),
    category: z.string().optional(),
  })
  .strict()

export const CartSummaryItemSchema = z
  .object({
    name: z.string(),
    qty: z.int(),
    price_try: z.number(),
  })
  .strict()

export const CartSummarySchema = z
  .object({
    type: z.literal('cart_summary'),
    restaurant_id: z.string().optional(),
    items: z.array(CartSummaryItemSchema),
    subtotal_try: z.number().optional(),
    delivery_fee_try: z.number().optional(),
    total_try: z.number(),
    min_order_try: z.number().optional(),
    meets_minimum: z.boolean().optional(),
  })
  .strict()

export const OrderSummarySchema = z
  .object({
    type: z.literal('order_summary'),
    order_id: z.string(),
    restaurant: z.string().optional(),
    total_try: z.number().optional(),
    status: z.string(),
    eta_min: z.int().optional(),
    date: z.string().optional(),
    note: z.string().optional(),
  })
  .strict()

export const ConfirmationActionSchema = z.enum([
  'place_order',
  'cancel_order',
  'add_tip',
])

export const ConfirmationPromptSchema = z
  .object({
    type: z.literal('confirmation_prompt'),
    action: ConfirmationActionSchema,
    summary: z.string(),
    params: ParamsSchema,
    confirm_token: z.string().min(1),
    expires_at: z.string().min(1),
  })
  .strict()

export const GateRequirementSchema = z.enum([
  'out_of_service_area',
  'item_unavailable',
  'age_18_plus',
  'min_order',
  'sufficient_funds',
  'not_cancellable',
  'tip_window_expired',
])

export const VerificationGateSchema = z
  .object({
    type: z.literal('verification_gate'),
    requirement: GateRequirementSchema,
    reason: z.string(),
    cta: z.string(),
  })
  .strict()

export const SuggestedActionsSchema = z
  .object({
    type: z.literal('suggested_actions'),
    chips: z.array(z.string()),
  })
  .strict()

export const ErrorBlockSchema = z
  .object({
    type: z.literal('error'),
    code: z.string(),
    message: z.string(),
  })
  .strict()

export const KnownBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  RestaurantCardSchema,
  MenuItemSchema,
  CartSummarySchema,
  OrderSummarySchema,
  ConfirmationPromptSchema,
  VerificationGateSchema,
  SuggestedActionsSchema,
  ErrorBlockSchema,
])

export const AuditDecisionSchema = z.enum([
  'answered',
  'needs_confirmation',
  'blocked',
  'clarify',
  'refused',
  'unknown',
])

export const AuditSchema = z
  .object({
    decision: AuditDecisionSchema,
    reason: z.string().optional(),
    user_id: z.string().optional(),
    intent: z.string().optional(),
    tools_called: z.array(z.string()).optional(),
    kb_doc_ids: z.array(z.string()).optional(),
  })
  .strict()

export const UiSpecDocumentSchema = z
  .object({
    version: z.literal('1'),
    blocks: z.array(z.unknown()).min(1),
    audit: AuditSchema,
  })
  .strict()

export const KNOWN_BLOCK_TYPES = [
  'text',
  'restaurant_card',
  'menu_item',
  'cart_summary',
  'order_summary',
  'confirmation_prompt',
  'verification_gate',
  'suggested_actions',
  'error',
] as const

export type KnownBlockType = (typeof KNOWN_BLOCK_TYPES)[number]

export function isKnownBlockType(value: string): value is KnownBlockType {
  return (KNOWN_BLOCK_TYPES as readonly string[]).includes(value)
}
