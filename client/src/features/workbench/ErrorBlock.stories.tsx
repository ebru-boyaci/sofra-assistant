import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorBlockView } from '@/features/chat/blocks/ErrorBlock'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Error',
    note: 'A catalog error block: code plus message. Transport failures (429, 500, incomplete) are turn status, not this block.',
    node: (
      <ErrorBlockView
        block={{
          type: 'error',
          code: 'tool_failed',
          message: 'The menu could not be loaded. Try again.',
        }}
      />
    ),
  },
]

const meta = {
  title: 'Blocks/Error',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Error: Story = {
  render: () => items[0]!.node,
}
