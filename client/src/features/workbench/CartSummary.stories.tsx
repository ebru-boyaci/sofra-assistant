import type { Meta, StoryObj } from '@storybook/react-vite'
import { CartSummary } from '@/features/chat/blocks/CartSummary'
import { cartBelowMinimum, cartFreeDelivery, cartPaidDelivery } from './fixtures'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Free delivery',
    note: 'delivery_fee_try is 0 because the server already applied the over-250 TL policy. The client does not recompute it.',
    node: <CartSummary block={cartFreeDelivery} />,
  },
  {
    name: 'Paid delivery',
    node: <CartSummary block={cartPaidDelivery} />,
  },
  {
    name: 'Below minimum',
    note: 'meets_minimum: false is visible, with the server’s min_order_try.',
    node: <CartSummary block={cartBelowMinimum} />,
  },
]

const meta = {
  title: 'Blocks/Cart summary',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const FreeDelivery: Story = {
  name: 'Free delivery',
  render: () => items[0]!.node,
}

export const PaidDelivery: Story = {
  name: 'Paid delivery',
  render: () => items[1]!.node,
}

export const BelowMinimum: Story = {
  name: 'Below minimum',
  render: () => items[2]!.node,
}
