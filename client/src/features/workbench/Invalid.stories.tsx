import type { Meta, StoryObj } from '@storybook/react-vite'
import { FailClosedBlocks, FailClosedDocument } from './FailClosed'
import { StateStack, type StateItem } from './StateStack'

const items: StateItem[] = [
  {
    name: 'Unknown type',
    note: 'map_view is outside the v1 catalog. It is skipped. The text around it still renders.',
    node: (
      <FailClosedBlocks
        rawBlocks={[
          { type: 'text', markdown: 'Here is what I can show.' },
          { type: 'map_view', restaurant_id: 'rst_napoli' },
          { type: 'text', markdown: 'The map block was not drawn.' },
        ]}
      />
    ),
  },
  {
    name: 'Invalid field',
    note: 'price_try must be a number. “195 TL” is not rendered as a price. The valid item beside it still renders.',
    node: (
      <FailClosedBlocks
        rawBlocks={[
          {
            type: 'menu_item',
            item_id: 'itm_ok',
            name: 'Cheeseburger',
            price_try: 195,
            available: true,
            age_restricted: false,
          },
          {
            type: 'menu_item',
            item_id: 'itm_bad',
            name: 'Broken burger',
            price_try: '195 TL',
            available: true,
            age_restricted: false,
          },
        ]}
      />
    ),
  },
  {
    name: 'Malformed confirmation',
    note: 'expires_at is missing. The token is not actionable: no Confirm control is rendered.',
    node: (
      <FailClosedBlocks
        rawBlocks={[
          { type: 'text', markdown: 'Ready when you are.' },
          {
            type: 'confirmation_prompt',
            action: 'place_order',
            summary: '2 cheeseburgers from Burger Stop',
            params: { total_try: 390 },
            confirm_token: 'tok_real_but_malformed',
          },
        ]}
      />
    ),
  },
  {
    name: 'Empty and untyped slots',
    note: 'A null slot, a string, and an object without a string type never become blocks.',
    node: (
      <FailClosedBlocks rawBlocks={[null, 'not-a-block', { type: 3 }]} />
    ),
  },
  {
    name: 'Version 2 document',
    note: 'Anything other than version "1" is refused. The blocks inside are not drawn.',
    node: (
      <FailClosedDocument
        raw={{
          version: '2',
          blocks: [{ type: 'text', markdown: 'This must not render.' }],
          audit: { decision: 'answered' },
        }}
      />
    ),
  },
]

const meta = {
  title: 'Blocks/Invalid',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => <StateStack items={items} />,
}

export const UnknownType: Story = {
  name: 'Unknown type',
  render: () => items[0]!.node,
}

export const InvalidField: Story = {
  name: 'Invalid field',
  render: () => items[1]!.node,
}

export const MalformedConfirmation: Story = {
  name: 'Malformed confirmation',
  render: () => items[2]!.node,
}

export const EmptySlots: Story = {
  name: 'Empty and untyped slots',
  render: () => items[3]!.node,
}

export const Version2: Story = {
  name: 'Version 2 document',
  render: () => items[4]!.node,
}
