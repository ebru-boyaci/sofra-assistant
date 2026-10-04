import type { Meta, StoryObj } from '@storybook/react-vite'
import { MenuGroup } from '@/features/chat/blocks/MenuItem/MenuGroup'
import { MenuItem } from '@/features/chat/blocks/MenuItem'
import {
  menuAgeRestricted,
  menuAvailable,
  menuUnavailable,
  menuUnavailableAndRestricted,
} from './fixtures'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Available',
    node: <MenuItem block={menuAvailable} />,
  },
  {
    name: 'Out of stock',
    note: 'available: false is visible before anyone tries to order.',
    node: <MenuItem block={menuUnavailable} />,
  },
  {
    name: 'Age restricted',
    note: 'age_restricted: true stays visible even when the item can still be ordered.',
    node: <MenuItem block={menuAgeRestricted} />,
  },
  {
    name: 'Out of stock and age restricted',
    node: <MenuItem block={menuUnavailableAndRestricted} />,
  },
  {
    name: 'Grouped',
    note: 'Consecutive items that share a category render as one menu group in the transcript.',
    node: (
      <MenuGroup
        categoryTitle="Burgers"
        items={[menuAvailable, { ...menuUnavailable, category: 'burgers' }]}
      />
    ),
  },
]

const meta = {
  title: 'Blocks/Menu item',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Available: Story = {
  render: () => items[0]!.node,
}

export const OutOfStock: Story = {
  name: 'Out of stock',
  render: () => items[1]!.node,
}

export const AgeRestricted: Story = {
  name: 'Age restricted',
  render: () => items[2]!.node,
}

export const OutOfStockAndRestricted: Story = {
  name: 'Out of stock and age restricted',
  render: () => items[3]!.node,
}

export const Grouped: Story = {
  render: () => items[4]!.node,
}
