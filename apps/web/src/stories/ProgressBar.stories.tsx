import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgressBar } from '@lifecalling/ui';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 65,
    max: 100,
    showLabel: true,
    label: 'Progresso',
  },
};

export const Small: Story = {
  args: {
    value: 45,
    max: 100,
    size: 'sm',
    showLabel: true,
    label: 'Pequeno',
  },
};

export const Large: Story = {
  args: {
    value: 80,
    max: 100,
    size: 'lg',
    showLabel: true,
    label: 'Grande',
  },
};

export const Success: Story = {
  args: {
    value: 90,
    max: 100,
    variant: 'success',
    showLabel: true,
    label: 'Sucesso',
  },
};

export const Warning: Story = {
  args: {
    value: 60,
    max: 100,
    variant: 'warning',
    showLabel: true,
    label: 'Atenção',
  },
};

export const Danger: Story = {
  args: {
    value: 25,
    max: 100,
    variant: 'danger',
    showLabel: true,
    label: 'Crítico',
  },
};

export const WithoutLabel: Story = {
  args: {
    value: 70,
    max: 100,
    showLabel: false,
  },
};

export const CustomMax: Story = {
  args: {
    value: 150,
    max: 200,
    showLabel: true,
    label: 'Meta Personalizada',
  },
};