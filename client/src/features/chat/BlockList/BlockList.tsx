import type { ConfirmationView } from '@/domain/confirmation'
import type {
  CartSummaryBlock,
  ConfirmationPromptBlock,
  MenuItemBlock,
  OrderSummaryBlock,
  TrustedBlock,
} from '@/domain/ui-spec'
import { MenuGroup } from '../blocks/MenuItem/MenuGroup'
import { BlockRenderer } from '../BlockRenderer'
import styles from './BlockList.module.css'

function confirmContextFor(
  blocks: readonly TrustedBlock[],
  index: number,
): CartSummaryBlock | OrderSummaryBlock | null {
  const prev = blocks[index - 1]
  if (prev?.type === 'cart_summary' || prev?.type === 'order_summary') {
    return prev
  }
  return null
}

function isAbsorbedIntoConfirm(
  blocks: readonly TrustedBlock[],
  index: number,
): boolean {
  const block = blocks[index]
  const next = blocks[index + 1]
  if (next?.type !== 'confirmation_prompt') return false
  return block.type === 'cart_summary' || block.type === 'order_summary'
}

export type BlockListProps = {
  blocks: readonly TrustedBlock[]
  onConfirm?: (block: ConfirmationPromptBlock) => void
  onSuggestedAction?: (text: string) => void
  getConfirmView?: (token: string) => ConfirmationView | null
  confirmDisabled?: boolean
  suggestedDisabled?: boolean
}

function blockKey(block: TrustedBlock, index: number): string {
  switch (block.type) {
    case 'restaurant_card':
      return `${index}:restaurant_card:${block.restaurant_id}`
    case 'menu_item':
      return `${index}:menu_item:${block.item_id}`
    case 'order_summary':
      return `${index}:order_summary:${block.order_id}`
    case 'confirmation_prompt':
      return `${index}:confirmation_prompt:${block.confirm_token}`
    case 'error':
      return `${index}:error:${block.code}`
    default:
      return `${index}:${block.type}`
  }
}

function categoryHeading(category: string): string {
  return category.replace(/^./u, (char) => char.toLocaleUpperCase('en-US'))
}

type MenuRun = {
  kind: 'menu'
  start: number
  category: string | null
  items: MenuItemBlock[]
}

type SingleRun = {
  kind: 'single'
  index: number
  block: TrustedBlock
}

function buildRuns(blocks: readonly TrustedBlock[]): Array<MenuRun | SingleRun> {
  const runs: Array<MenuRun | SingleRun> = []
  let index = 0

  while (index < blocks.length) {
    if (isAbsorbedIntoConfirm(blocks, index)) {
      index += 1
      continue
    }

    const block = blocks[index]!
    if (block.type === 'menu_item') {
      const category = block.category ?? null
      const items: MenuItemBlock[] = [block]
      let cursor = index + 1
      while (cursor < blocks.length) {
        const next = blocks[cursor]
        if (next?.type !== 'menu_item') break
        if ((next.category ?? null) !== category) break
        items.push(next)
        cursor += 1
      }
      runs.push({ kind: 'menu', start: index, category, items })
      index = cursor
      continue
    }

    runs.push({ kind: 'single', index, block })
    index += 1
  }

  return runs
}

export function BlockList({
  blocks,
  onConfirm,
  onSuggestedAction,
  getConfirmView,
  confirmDisabled,
  suggestedDisabled,
}: BlockListProps) {
  if (blocks.length === 0) return null

  const runs = buildRuns(blocks)

  return (
    <ul className={styles.list} aria-label="Assistant blocks">
      {runs.map((run) => {
        if (run.kind === 'menu') {
          return (
            <li
              key={`menu-group:${run.start}:${run.category ?? 'none'}`}
              className={styles.item}
            >
              <MenuGroup
                categoryTitle={
                  run.category != null ? categoryHeading(run.category) : undefined
                }
                items={run.items}
              />
            </li>
          )
        }

        return (
          <li key={blockKey(run.block, run.index)} className={styles.item}>
            <BlockRenderer
              block={run.block}
              confirmContext={
                run.block.type === 'confirmation_prompt'
                  ? confirmContextFor(blocks, run.index)
                  : null
              }
              onConfirm={onConfirm}
              onSuggestedAction={onSuggestedAction}
              confirmView={
                run.block.type === 'confirmation_prompt'
                  ? (getConfirmView?.(run.block.confirm_token) ?? null)
                  : null
              }
              confirmDisabled={confirmDisabled}
              suggestedDisabled={suggestedDisabled}
              getConfirmView={getConfirmView}
            />
          </li>
        )
      })}
    </ul>
  )
}
