import type { Meta, StoryObj } from '@storybook/react';
import { FinanceChart } from '../FinanceChart';

const meta: Meta<typeof FinanceChart> = {
  title: 'Finance/FinanceChart',
  component: FinanceChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinanceChart>;

const mockData6Months = {
  revenue: [
    { date: "Mai/2025", value: 150000 },
    { date: "Jun/2025", value: 180000 },
    { date: "Jul/2025", value: 165000 },
    { date: "Ago/2025", value: 195000 },
    { date: "Set/2025", value: 210000 },
    { date: "Out/2025", value: 225000 },
  ],
  expenses: [
    { date: "Mai/2025", value: 45000 },
    { date: "Jun/2025", value: 48000 },
    { date: "Jul/2025", value: 46000 },
    { date: "Ago/2025", value: 52000 },
    { date: "Set/2025", value: 50000 },
    { date: "Out/2025", value: 55000 },
  ],
  tax: [
    { date: "Mai/2025", value: 21000 },
    { date: "Jun/2025", value: 25200 },
    { date: "Jul/2025", value: 23100 },
    { date: "Ago/2025", value: 27300 },
    { date: "Set/2025", value: 29400 },
    { date: "Out/2025", value: 31500 },
  ],
  netProfit: [
    { date: "Mai/2025", value: 84000 },
    { date: "Jun/2025", value: 106800 },
    { date: "Jul/2025", value: 95900 },
    { date: "Ago/2025", value: 115700 },
    { date: "Set/2025", value: 130600 },
    { date: "Out/2025", value: 138500 },
  ],
};

export const Default: Story = {
  args: mockData6Months,
};

export const GrowthTrend: Story = {
  args: {
    revenue: [
      { date: "Mai/2025", value: 120000 },
      { date: "Jun/2025", value: 145000 },
      { date: "Jul/2025", value: 175000 },
      { date: "Ago/2025", value: 210000 },
      { date: "Set/2025", value: 255000 },
      { date: "Out/2025", value: 310000 },
    ],
    expenses: [
      { date: "Mai/2025", value: 40000 },
      { date: "Jun/2025", value: 42000 },
      { date: "Jul/2025", value: 45000 },
      { date: "Ago/2025", value: 48000 },
      { date: "Set/2025", value: 52000 },
      { date: "Out/2025", value: 58000 },
    ],
    tax: [
      { date: "Mai/2025", value: 16800 },
      { date: "Jun/2025", value: 20300 },
      { date: "Jul/2025", value: 24500 },
      { date: "Ago/2025", value: 29400 },
      { date: "Set/2025", value: 35700 },
      { date: "Out/2025", value: 43400 },
    ],
    netProfit: [
      { date: "Mai/2025", value: 63200 },
      { date: "Jun/2025", value: 82700 },
      { date: "Jul/2025", value: 105500 },
      { date: "Ago/2025", value: 132600 },
      { date: "Set/2025", value: 167300 },
      { date: "Out/2025", value: 208600 },
    ],
  },
};

export const DeclineTrend: Story = {
  args: {
    revenue: [
      { date: "Mai/2025", value: 280000 },
      { date: "Jun/2025", value: 245000 },
      { date: "Jul/2025", value: 210000 },
      { date: "Ago/2025", value: 185000 },
      { date: "Set/2025", value: 165000 },
      { date: "Out/2025", value: 150000 },
    ],
    expenses: [
      { date: "Mai/2025", value: 65000 },
      { date: "Jun/2025", value: 62000 },
      { date: "Jul/2025", value: 58000 },
      { date: "Ago/2025", value: 55000 },
      { date: "Set/2025", value: 52000 },
      { date: "Out/2025", value: 48000 },
    ],
    tax: [
      { date: "Mai/2025", value: 39200 },
      { date: "Jun/2025", value: 34300 },
      { date: "Jul/2025", value: 29400 },
      { date: "Ago/2025", value: 25900 },
      { date: "Set/2025", value: 23100 },
      { date: "Out/2025", value: 21000 },
    ],
    netProfit: [
      { date: "Mai/2025", value: 175800 },
      { date: "Jun/2025", value: 148700 },
      { date: "Jul/2025", value: 122600 },
      { date: "Ago/2025", value: 104100 },
      { date: "Set/2025", value: 89900 },
      { date: "Out/2025", value: 81000 },
    ],
  },
};

export const Volatile: Story = {
  args: {
    revenue: [
      { date: "Mai/2025", value: 180000 },
      { date: "Jun/2025", value: 220000 },
      { date: "Jul/2025", value: 165000 },
      { date: "Ago/2025", value: 245000 },
      { date: "Set/2025", value: 190000 },
      { date: "Out/2025", value: 235000 },
    ],
    expenses: [
      { date: "Mai/2025", value: 45000 },
      { date: "Jun/2025", value: 58000 },
      { date: "Jul/2025", value: 42000 },
      { date: "Ago/2025", value: 62000 },
      { date: "Set/2025", value: 48000 },
      { date: "Out/2025", value: 60000 },
    ],
    tax: [
      { date: "Mai/2025", value: 25200 },
      { date: "Jun/2025", value: 30800 },
      { date: "Jul/2025", value: 23100 },
      { date: "Ago/2025", value: 34300 },
      { date: "Set/2025", value: 26600 },
      { date: "Out/2025", value: 32900 },
    ],
    netProfit: [
      { date: "Mai/2025", value: 109800 },
      { date: "Jun/2025", value: 131200 },
      { date: "Jul/2025", value: 99900 },
      { date: "Ago/2025", value: 148700 },
      { date: "Set/2025", value: 115400 },
      { date: "Out/2025", value: 142100 },
    ],
  },
};
