import type { Meta, StoryObj } from '@storybook/react-vite'
import { BlockList } from '@/features/chat/BlockList'
import type { ConfirmationView } from '@/domain/confirmation'
import type { TrustedBlock } from '@/domain/ui-spec'
import {
  cancelPrompt,
  cartFreeDelivery,
  confirmationView,
  orderReceived,
  placeOrderPrompt,
  tipPrompt,
} from './fixtures'
import { StateStack, type StateItem } from './StateStack'

function confirmBlocks(
  blocks: readonly TrustedBlock[],
  view: ConfirmationView,
) {
  return (
    <BlockList
      blocks={blocks}
      onConfirm={() => undefined}
      getConfirmView={() => view}
    />
  )
}

const placed = [cartFreeDelivery, placeOrderPrompt]
const cancel = [orderReceived, cancelPrompt]
const tip = [tipPrompt]
const placedResult = [
  {
    type: 'order_summary' as const,
    order_id: 'u_ok_o9',
    restaurant: 'Burger Stop',
    total_try: 390,
    status: 'received',
    eta_min: 25,
    date: '2026-08-20',
  },
]

const items: StateItem[] = [
  {
    name: 'Place order — live',
    note: 'The cart is the context for the prompt. Confirm is not focused. The countdown is the server clock, frozen here at 4:32.',
    node: confirmBlocks(placed, confirmationView('LIVE')),
  },
  {
    name: 'Cancel order — live',
    node: confirmBlocks(cancel, confirmationView('LIVE')),
  },
  {
    name: 'Add tip — live',
    node: confirmBlocks(tip, confirmationView('LIVE')),
  },
  {
    name: 'Confirming',
    note: 'One in-flight execute. A second click does not send another request.',
    node: confirmBlocks(placed, confirmationView('CONFIRMING')),
  },
  {
    name: 'Reconciling',
    note: 'The execute call died without a response. Status is checked; the user is not asked to approve again.',
    node: confirmBlocks(
      placed,
      confirmationView('RECONCILING', 'Outcome unknown — checking again in 2s'),
    ),
  },
  {
    name: 'Done',
    note: 'The follow-up blocks are the server’s result, rendered under the prompt.',
    node: confirmBlocks(
      placed,
      confirmationView('DONE', null, placedResult),
    ),
  },
  {
    name: 'Expired',
    node: confirmBlocks(
      placed,
      confirmationView('EXPIRED', 'This confirmation expired'),
    ),
  },
  {
    name: 'Replaced',
    note: 'A newer prompt, or a gate that closed on an earlier attempt (void), both land here.',
    node: confirmBlocks(
      placed,
      confirmationView('SUPERSEDED', 'Replaced by a newer confirmation'),
    ),
  },
  {
    name: 'Cleared on user switch',
    note: 'Switching user marks the previous user’s live prompt superseded. It must not stay confirmable.',
    node: confirmBlocks(
      placed,
      confirmationView('SUPERSEDED', 'Cleared because the user changed'),
    ),
  },
  {
    name: 'Invalid token',
    node: confirmBlocks(
      placed,
      confirmationView('REJECTED', 'Confirmation could not be verified'),
    ),
  },
]

const meta = {
  title: 'Blocks/Confirmation',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const PlaceOrderLive: Story = {
  name: 'Place order — live',
  render: () => items[0]!.node,
}

export const CancelLive: Story = {
  name: 'Cancel order — live',
  render: () => items[1]!.node,
}

export const TipLive: Story = {
  name: 'Add tip — live',
  render: () => items[2]!.node,
}

export const Confirming: Story = {
  render: () => items[3]!.node,
}

export const Reconciling: Story = {
  render: () => items[4]!.node,
}

export const Done: Story = {
  render: () => items[5]!.node,
}

export const Expired: Story = {
  render: () => items[6]!.node,
}

export const Replaced: Story = {
  render: () => items[7]!.node,
}

export const ClearedOnUserSwitch: Story = {
  name: 'Cleared on user switch',
  render: () => items[8]!.node,
}

export const InvalidToken: Story = {
  name: 'Invalid token',
  render: () => items[9]!.node,
}
