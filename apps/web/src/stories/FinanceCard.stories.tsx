import type { Meta, StoryObj } from '@storybook/nextjs';
import { FinanceCard } from '@lifecalling/ui';

const meta: Meta<typeof FinanceCard> = {
  title: 'Components/FinanceCard',
  component: FinanceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['pending', 'approved', 'disbursed', 'overdue'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    id: 1001,
    clientName: 'João Silva',
    totalAmount: 50000,
    installments: 12,
    status: 'pending',
    dueDate: '2024-12-31',
    onApprove: (id) => console.log('Approved:', id),
    onReject: (id) => console.log('Rejected:', id),
  },
};

export const Approved: Story = {
  args: {
    id: 1002,
    clientName: 'Maria Santos',
    totalAmount: 75000,
    installments: 18,
    status: 'approved',
    dueDate: '2024-11-15',
    onDisburse: (id, amount, installments) =>
      console.log('Disbursed:', id, amount, installments),
  },
};

export const Disbursed: Story = {
  args: {
    id: 1003,
    clientName: 'Carlos Oliveira',
    totalAmount: 100000,
    installments: 24,
    paidInstallments: 8,
    status: 'disbursed',
    dueDate: '2024-10-20',
  },
};

export const Overdue: Story = {
  args: {
    id: 1004,
    clientName: 'Ana Costa',
    totalAmount: 40000,
    installments: 10,
    paidInstallments: 3,
    status: 'overdue',
    dueDate: '2024-09-01',
  },
};

export const HighProgress: Story = {
  args: {
    id: 1005,
    clientName: 'Pedro Almeida',
    totalAmount: 80000,
    installments: 15,
    paidInstallments: 13,
    status: 'disbursed',
    dueDate: '2024-11-30',
  },
};

export const LowProgress: Story = {
  args: {
    id: 1006,
    clientName: 'Lucia Ferreira',
    totalAmount: 60000,
    installments: 20,
    paidInstallments: 2,
    status: 'disbursed',
    dueDate: '2024-12-15',
  },
};