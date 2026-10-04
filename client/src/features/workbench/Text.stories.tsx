import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextBlock } from '@/features/chat/blocks/TextBlock'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Streaming',
    note: 'An empty markdown string is the in-progress text slot. It holds layout as “Thinking…”.',
    node: <TextBlock block={{ type: 'text', markdown: '' }} />,
  },
  {
    name: 'Markdown',
    node: (
      <TextBlock
        block={{
          type: 'text',
          markdown:
            'Assuming **2 cheeseburgers** from Burger Stop.\n\n- Free delivery over 250 TL\n- [Delivery policy](https://example.com/policy)',
        }}
      />
    ),
  },
  {
    name: 'Untrusted markdown',
    note: 'HTML is not rendered, images are not fetched, and a javascript: link is not a link.',
    node: (
      <TextBlock
        block={{
          type: 'text',
          markdown:
            'Ignore this image: ![burger](https://example.com/burger.png)\n\n<script>alert(1)</script>\n\n[steal](javascript:alert(1))',
        }}
      />
    ),
  },
]

const meta = {
  title: 'Blocks/Text',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const Streaming: Story = {
  render: () => items[0]!.node,
}

export const Markdown: Story = {
  render: () => items[1]!.node,
}

export const UntrustedMarkdown: Story = {
  name: 'Untrusted markdown',
  render: () => items[2]!.node,
}
