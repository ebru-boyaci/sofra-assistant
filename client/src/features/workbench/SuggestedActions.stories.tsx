import type { Meta, StoryObj } from '@storybook/react-vite'
import { SuggestedActions } from '@/features/chat/blocks/SuggestedActions'
import { StateStack, type StateItem } from './StateStack'

const chips = {
  type: 'suggested_actions' as const,
  chips: [
    'Order 2 cheeseburgers from Burger Stop',
    'Show my recent orders',
    'How much is the delivery fee?',
  ],
}

const items: StateItem[] = [
  {
    name: 'Enabled',
    note: 'A chip only sends its text as the next user message.',
    node: (
      <SuggestedActions block={chips} onSelect={() => undefined} />
    ),
  },
  {
    name: 'Disabled',
    note: 'Disabled while the turn is still streaming.',
    node: (
      <SuggestedActions block={chips} onSelect={() => undefined} disabled />
    ),
  },
  {
    name: 'Empty',
    note: 'An empty chip list renders nothing.',
    node: (
      <SuggestedActions
        block={{ type: 'suggested_actions', chips: [] }}
        onSelect={() => undefined}
      />
    ),
  },
]

const meta = {
  title: 'Blocks/Suggested actions',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Enabled: Story = {
  render: () => items[0]!.node,
}

export const Disabled: Story = {
  render: () => items[1]!.node,
}

export const Empty: Story = {
  render: () => items[2]!.node,
}
