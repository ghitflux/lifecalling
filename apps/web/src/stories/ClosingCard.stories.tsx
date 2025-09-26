import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ClosingCard } from '@lifecalling/ui';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof ClosingCard> = {
  title: 'Components/ClosingCard',
  component: ClosingCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onApprove: { action: 'approved' },
    onReject: { action: 'rejected' },
    onViewDetails: { action: 'view details' },
    isLoading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCase = {
  id: 1234,
  status: 'calculista_pendente' as const,
  client: {
    name: 'João Silva Santos',
    cpf: '123.456.789-01',
    matricula: 'MAT001',
    orgao: 'INSS',
  },
  banco: 'Bradesco',
  created_at: '2024-01-15T10:30:00Z',
  last_update_at: '2024-01-16T14:20:00Z',
};

export const Default: Story = {
  args: {
    case: mockCase,
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: false,
  },
};

export const WithSimulation: Story = {
  args: {
    case: {
      ...mockCase,
      simulation: {
        total_amount: 150000,
        installments: 60,
        monthly_payment: 2800,
      },
    },
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: false,
  },
};

export const WithContract: Story = {
  args: {
    case: {
      ...mockCase,
      status: 'aprovado' as const,
      contract: {
        total_amount: 180000,
        installments: 72,
      },
    },
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    case: mockCase,
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: true,
  },
};

export const HighValue: Story = {
  args: {
    case: {
      ...mockCase,
      client: {
        name: 'Maria Oliveira Costa',
        cpf: '987.654.321-00',
        matricula: 'MAT002',
        orgao: 'Governo do Estado',
      },
      banco: 'Itaú',
      simulation: {
        total_amount: 500000,
        installments: 84,
        monthly_payment: 7200,
      },
    },
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: false,
  },
};

export const MinimalInfo: Story = {
  args: {
    case: {
      id: 5678,
      status: 'em_atendimento' as const,
      client: {
        name: 'Pedro Almeida',
        cpf: '456.789.123-45',
        matricula: 'MAT003',
      },
      created_at: '2024-01-10T08:15:00Z',
    },
    onApprove: action('approve'),
    onReject: action('reject'),
    onViewDetails: action('view-details'),
    isLoading: false,
  },
};

export const DifferentStatuses: Story = {
  render: () => (
    <div className="grid gap-4 max-w-4xl">
      <ClosingCard
        case={{
          ...mockCase,
          id: 1001,
          status: 'novo',
        }}
        onApprove={action('approve')}
        onReject={action('reject')}
        onViewDetails={action('view-details')}
      />
      <ClosingCard
        case={{
          ...mockCase,
          id: 1002,
          status: 'em_atendimento',
        }}
        onApprove={action('approve')}
        onReject={action('reject')}
        onViewDetails={action('view-details')}
      />
      <ClosingCard
        case={{
          ...mockCase,
          id: 1003,
          status: 'aprovado',
        }}
        onApprove={action('approve')}
        onReject={action('reject')}
        onViewDetails={action('view-details')}
      />
    </div>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-6xl">
      {Array.from({ length: 6 }, (_, i) => (
        <ClosingCard
          key={i}
          case={{
            ...mockCase,
            id: 2000 + i,
            client: {
              ...mockCase.client,
              name: `Cliente ${i + 1}`,
            },
            simulation: i % 2 === 0 ? {
              total_amount: 100000 + (i * 25000),
              installments: 48 + (i * 6),
              monthly_payment: 2000 + (i * 300),
            } : undefined,
          }}
          onApprove={action('approve')}
          onReject={action('reject')}
          onViewDetails={action('view-details')}
        />
      ))}
    </div>
  ),
};
