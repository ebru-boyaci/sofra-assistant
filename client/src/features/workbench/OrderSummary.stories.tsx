import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderSummary } from '@/features/chat/blocks/OrderSummary'
import { orderCancelled, orderDelivered, orderReceived } from './fixtures'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Received',
    note: '“today” is the server’s Istanbul day (2026-08-20), not the laptop clock.',
    node: <OrderSummary block={orderReceived} />,
  },
  {
    name: 'Delivered',
    node: <OrderSummary block={orderDelivered} />,
  },
  {
    name: 'Cancelled',
    note: 'The customer note is plain text. Markup in the note is shown as characters, not HTML.',
    node: <OrderSummary block={orderCancelled} />,
  },
]

const meta = {
  title: 'Blocks/Order summary',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Received: Story = {
  render: () => items[0]!.node,
}

export const Delivered: Story = {
  render: () => items[1]!.node,
}

export const Cancelled: Story = {
  render: () => items[2]!.node,
}
