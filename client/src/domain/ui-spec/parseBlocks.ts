import { ZodError } from 'zod'
import {
  AuditSchema,
  ConfirmationPromptSchema,
  KnownBlockSchema,
  UiSpecDocumentSchema,
  isKnownBlockType,
} from './blockSchemas'
import type {
  ConfirmationPromptBlock,
  ParseBlocksResult,
  ParseDocumentResult,
  TrustedBlock,
  ValidationFailure,
} from './types'

function zodDetails(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)'
    return `${path}: ${issue.message}`
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}


export function parseBlockAtIndex(
  raw: unknown,
  index: number,
): { block: TrustedBlock | null; failure: ValidationFailure | null } {
  if (raw === undefined || raw === null) {
    return {
      block: null,
      failure: {
        index,
        kind: 'empty_slot',
        type: null,
        message: 'Empty block slot',
        details: [],
      },
    }
  }

  if (!isRecord(raw) || typeof raw.type !== 'string') {
    return {
      block: null,
      failure: {
        index,
        kind: 'invalid_block',
        type: null,
        message: 'Block is not an object with a string type',
        details: [],
      },
    }
  }

  if (!isKnownBlockType(raw.type)) {
    return {
      block: null,
      failure: {
        index,
        kind: 'unknown_type',
        type: raw.type,
        message: `Unknown block type "${raw.type}" — skipped`,
        details: [],
      },
    }
  }

  const parsed = KnownBlockSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      block: null,
      failure: {
        index,
        kind: 'invalid_block',
        type: raw.type,
        message:
          raw.type === 'confirmation_prompt'
            ? 'Invalid confirmation_prompt — Confirm control must not be rendered'
            : `Invalid ${raw.type} block — not rendered`,
        details: zodDetails(parsed.error),
      },
    }
  }

  return { block: parsed.data, failure: null }
}

export function parseBlockList(
  rawBlocks: ReadonlyArray<unknown>,
): ParseBlocksResult {
  const blocks: TrustedBlock[] = []
  const failures: ValidationFailure[] = []
  let rejectedConfirmation = false

  rawBlocks.forEach((raw, index) => {
    if (
      isRecord(raw) &&
      raw.type === 'confirmation_prompt' &&
      !ConfirmationPromptSchema.safeParse(raw).success
    ) {
      rejectedConfirmation = true
    }

    const { block, failure } = parseBlockAtIndex(raw, index)
    if (failure) {
      failures.push(failure)
      if (failure.type === 'confirmation_prompt' && failure.kind === 'invalid_block') {
        rejectedConfirmation = true
      }
    }
    if (block) blocks.push(block)
  })

  return { blocks, failures, rejectedConfirmation }
}

export function parseUiSpecDocument(raw: unknown): ParseDocumentResult {
  const shell = UiSpecDocumentSchema.safeParse(raw)
  if (!shell.success) {
    return {
      ok: false,
      failures: [
        {
          index: -1,
          kind: 'invalid_document',
          type: null,
          message: 'Response is not a valid ui_spec document',
          details: zodDetails(shell.error),
        },
      ],
    }
  }

  const auditParsed = AuditSchema.safeParse(shell.data.audit)
  if (!auditParsed.success) {
    return {
      ok: false,
      failures: [
        {
          index: -1,
          kind: 'invalid_document',
          type: null,
          message: 'Invalid audit record',
          details: zodDetails(auditParsed.error),
        },
      ],
    }
  }

  const { blocks, failures, rejectedConfirmation } = parseBlockList(shell.data.blocks)

  return {
    ok: true,
    version: '1',
    audit: auditParsed.data,
    blocks,
    failures,
    rejectedConfirmation,
  }
}

export function isActionableConfirmation(
  block: TrustedBlock,
): block is ConfirmationPromptBlock {
  return block.type === 'confirmation_prompt'
}

export function actionableConfirmations(
  blocks: readonly TrustedBlock[],
): ConfirmationPromptBlock[] {
  return blocks.filter(isActionableConfirmation)
}
