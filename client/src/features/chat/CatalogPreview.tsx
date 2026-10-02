import { syncServerClock } from '@/domain/clock'
import type { ConfirmationPromptBlock, TrustedBlock } from '@/domain/ui-spec'
import { useConfirmation } from '@/features/confirmation'
import { useCurrentUser } from '@/shared/useCurrentUser'
import { useEffect } from 'react'
import { BlockList } from './BlockList'
import styles from './CatalogPreview.module.css'

const PREVIEW_BLOCKS: TrustedBlock[] = [
  {
    type: 'text',
    markdown: 'Block catalog preview — streaming text stays layout-stable.',
  },
  {
    type: 'restaurant_card',
    restaurant_id: 'rst_preview',
    name: 'Burger Stop',
    cuisine: 'Burgers',
    rating: 4.6,
    delivery_fee_try: 25,
    min_order_try: 150,
    eta_min: 35,
    district: 'Kadıköy',
  },
  {
    type: 'menu_item',
    item_id: 'mi_beer',
    name: 'Craft Beer',
    price_try: 95,
    available: false,
    age_restricted: true,
    category: 'Drinks',
  },
  {
    type: 'cart_summary',
    restaurant_id: 'rst_preview',
    items: [{ name: 'Cheeseburger', qty: 1, price_try: 120 }],
    subtotal_try: 120,
    delivery_fee_try: 25,
    total_try: 145,
    min_order_try: 150,
    meets_minimum: false,
  },
  {
    type: 'order_summary',
    order_id: 'ord_preview',
    restaurant: 'Burger Stop',
    total_try: 390,
    status: 'received',
    eta_min: 40,
    date: '2026-08-20',
    note: 'Extra napkins please',
  },
  {
    type: 'order_summary',
    order_id: 'ord_old',
    restaurant: 'Ege Balık',
    total_try: 520,
    status: 'delivered',
    date: '2026-07-10',
  },
  {
    type: 'confirmation_prompt',
    action: 'place_order',
    summary: 'Place order for 2× Cheeseburger — 390 TL',
    params: { restaurant_id: 'rst_preview' },
    confirm_token: 'tok_preview',
    expires_at: '2099-01-01T00:00:00.000Z',
  },
  {
    type: 'verification_gate',
    requirement: 'sufficient_funds',
    reason: 'Wallet balance is below the order total.',
    cta: 'Top up your wallet or choose a cheaper restaurant',
  },
  {
    type: 'suggested_actions',
    chips: ['Show my cart', 'Browse Burger Stop'],
  },
  {
    type: 'error',
    code: 'preview_error',
    message: 'Sample error block for the catalog.',
  },
]

export function CatalogPreview() {
  const { userId } = useCurrentUser()
  const { register, confirm, viewFor, store } = useConfirmation()

  useEffect(() => {
    syncServerClock('2026-08-20T09:00:00.000Z')
    for (const block of PREVIEW_BLOCKS) {
      if (block.type === 'confirmation_prompt') {
        register(userId, block)
      }
    }
  }, [register, userId])

  const followUps = store
    .getAll()
    .flatMap((entry) => entry.nextBlocks ?? [])

  return (
    <section className={styles.root} aria-label="Block catalog preview">
      <h2 className={styles.title}>Block catalog</h2>
      <p className={styles.hint}>
        Confirm is wired to the confirmation controller (one execute max).
      </p>
      <BlockList
        blocks={PREVIEW_BLOCKS}
        getConfirmView={viewFor}
        onConfirm={(block: ConfirmationPromptBlock) => {
          void confirm(block.confirm_token)
        }}
      />
      {followUps.length > 0 && (
        <BlockList
          blocks={followUps}
          getConfirmView={viewFor}
          onConfirm={(block: ConfirmationPromptBlock) => {
            void confirm(block.confirm_token)
          }}
        />
      )}
    </section>
  )
}
