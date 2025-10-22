import type { Meta, StoryObj } from '@storybook/react-native'
import { QuickLevelPanel } from './QuickLevelPanel'

const meta: Meta<typeof QuickLevelPanel> = {
  title: 'Components/QuickLevelPanel',
  component: QuickLevelPanel,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    pitch: {
      control: { type: 'number', step: 0.1 },
      description: 'Pitch angle in degrees',
    },
    roll: {
      control: { type: 'number', step: 0.1 },
      description: 'Roll angle in degrees',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pitch: 1.2,
    roll: -2.1,
  },
}

export const Level: Story = {
  args: {
    pitch: 0.0,
    roll: 0.0,
  },
}

export const SteepPitch: Story = {
  args: {
    pitch: 5.0,
    roll: 0.0,
  },
}

export const SteepRoll: Story = {
  args: {
    pitch: 0.0,
    roll: -4.5,
  },
}

