import type { Preview } from '@storybook/react-vite'
import { syncServerClock } from '@/domain/clock'
import { WorkbenchProviders } from '@/features/workbench/WorkbenchProviders'
import '@/index.css'
import './preview.css'

syncServerClock('2026-08-20T12:00:00+03:00')

const preview: Preview = {
  decorators: [
    (Story) => (
      <WorkbenchProviders>
        <div className="workbench-canvas">
          <Story />
        </div>
      </WorkbenchProviders>
    ),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'sofra',
      options: {
        sofra: { name: 'sofra', value: '#f8f7f5' },
      },
    },
    options: {
      storySort: {
        order: [
          'Blocks',
          [
            'Text',
            'Restaurant card',
            'Menu item',
            'Cart summary',
            'Order summary',
            'Confirmation',
            'Verification gate',
            'Suggested actions',
            'Error',
            'Invalid',
          ],
        ],
      },
    },
  },
}

export default preview
