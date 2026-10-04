import type { Meta, StoryObj } from '@storybook/react-vite'
import { VerificationGate } from '@/features/chat/blocks/VerificationGate'
import { verificationGates } from './fixtures'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = verificationGates.map((block) => ({
  name: block.requirement,
  note: 'Nothing was executed. There is no Confirm control.',
  node: <VerificationGate block={block} />,
}))

const meta = {
  title: 'Blocks/Verification gate',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const OutOfServiceArea: Story = {
  name: 'out_of_service_area',
  render: () => items[0]!.node,
}

export const ItemUnavailable: Story = {
  name: 'item_unavailable',
  render: () => items[1]!.node,
}

export const Age18Plus: Story = {
  name: 'age_18_plus',
  render: () => items[2]!.node,
}

export const MinOrder: Story = {
  name: 'min_order',
  render: () => items[3]!.node,
}

export const SufficientFunds: Story = {
  name: 'sufficient_funds',
  render: () => items[4]!.node,
}

export const NotCancellable: Story = {
  name: 'not_cancellable',
  render: () => items[5]!.node,
}

export const TipWindowExpired: Story = {
  name: 'tip_window_expired',
  render: () => items[6]!.node,
}
