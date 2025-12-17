import type { Meta, StoryObj } from '@storybook/react';
import { RankingTable } from '@lifecalling/ui';

const meta: Meta<typeof RankingTable> = {
  title: 'Components/RankingTable',
  component: RankingTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
  { pos: 1, user_id: 101, name: 'Ana Souza', contracts: 12, consultoria_liq: 18500, ticket_medio: 1541.67, trend_consult: 2500 },
  { pos: 2, user_id: 102, name: 'Bruno Lima', contracts: 9, consultoria_liq: 13200, ticket_medio: 1466.67, trend_consult: -800 },
  { pos: 3, user_id: 103, name: 'Carla Mendes', contracts: 7, consultoria_liq: 9800, ticket_medio: 1400, trend_consult: 1200 },
];

export const Default: Story = {
  args: {
    data: mockData,
    columns: [
      { key: 'pos', header: '#' },
      { key: 'name', header: 'Atendente' },
      { key: 'contracts', header: 'Contratos', format: 'number' },
      { key: 'consultoria_liq', header: 'Consult. Líq.', format: 'currency' },
      { key: 'ticket_medio', header: 'Ticket Médio', format: 'currency' },
      { key: 'trend_consult', header: 'Δ Consult.', format: 'signedCurrency' },
    ],
  },
};
