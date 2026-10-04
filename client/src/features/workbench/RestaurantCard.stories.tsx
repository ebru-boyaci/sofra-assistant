import type { Meta, StoryObj } from '@storybook/react-vite'
import { RestaurantCard } from '@/features/chat/blocks/RestaurantCard'
import { restaurantFull, restaurantSparse } from './fixtures'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Full',
    note: 'The card shows the restaurant’s own delivery fee. Cart policy is applied later, on the cart summary.',
    node: <RestaurantCard block={restaurantFull} />,
  },
  {
    name: 'Name only',
    note: 'Cuisine, rating, fee, minimum, ETA, and district are optional.',
    node: <RestaurantCard block={restaurantSparse} />,
  },
]

const meta = {
  title: 'Blocks/Restaurant card',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Full: Story = {
  render: () => items[0]!.node,
}

export const NameOnly: Story = {
  name: 'Name only',
  render: () => items[1]!.node,
}
