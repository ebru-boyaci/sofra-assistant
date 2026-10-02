import type { z } from 'zod'
import type {
  AuditSchema,
  CartSummarySchema,
  ConfirmationPromptSchema,
  ErrorBlockSchema,
  KnownBlockSchema,
  MenuItemSchema,
  OrderSummarySchema,
  RestaurantCardSchema,
  SuggestedActionsSchema,
  TextBlockSchema,
  VerificationGateSchema,
} from './blockSchemas'

export type TextBlock = z.infer<typeof TextBlockSchema>
export type RestaurantCardBlock = z.infer<typeof RestaurantCardSchema>
export type MenuItemBlock = z.infer<typeof MenuItemSchema>
export type CartSummaryBlock = z.infer<typeof CartSummarySchema>
export type OrderSummaryBlock = z.infer<typeof OrderSummarySchema>
export type ConfirmationPromptBlock = z.infer<typeof ConfirmationPromptSchema>
export type VerificationGateBlock = z.infer<typeof VerificationGateSchema>
export type SuggestedActionsBlock = z.infer<typeof SuggestedActionsSchema>
export type ErrorBlock = z.infer<typeof ErrorBlockSchema>

export type TrustedBlock = z.infer<typeof KnownBlockSchema>
export type AuditRecord = z.infer<typeof AuditSchema>

export type ValidationFailureKind =
  | 'unknown_type'
  | 'invalid_block'
  | 'empty_slot'
  | 'invalid_document'

export type ValidationFailure = {
  index: number
  kind: ValidationFailureKind
  type: string | null
  message: string
  details: string[]
}

export type ParseBlocksResult = {
  blocks: TrustedBlock[]
  failures: ValidationFailure[]
  rejectedConfirmation: boolean
}

export type ParseDocumentResult =
  | {
    ok: true
    version: '1'
    audit: AuditRecord
    blocks: TrustedBlock[]
    failures: ValidationFailure[]
    rejectedConfirmation: boolean
  }
  | {
    ok: false
    failures: ValidationFailure[]
  }
