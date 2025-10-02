import type { Meta, StoryObj } from '@storybook/react';
import { FinanceMetrics } from '../FinanceMetrics';

const meta: Meta<typeof FinanceMetrics> = {
  title: 'Finance/FinanceMetrics',
  component: FinanceMetrics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinanceMetrics>;

export const Default: Story = {
  args: {
    totalVolume: 500000,
    monthlyTarget: 600000,
    approvalRate: 85.5,
    pendingCount: 12,
    overdueCount: 3,
    averageTicket: 45000,
  },
};

export const WithFinancialData: Story = {
  args: {
    totalVolume: 800000,
    monthlyTarget: 1000000,
    approvalRate: 92.3,
    pendingCount: 8,
    overdueCount: 2,
    averageTicket: 52000,
    totalTax: 112000,
    totalExpenses: 85000,
    totalManualIncome: 25000,
    totalRevenue: 650000,
    netProfit: 453000,
  },
};

export const HighPerformance: Story = {
  args: {
    totalVolume: 1200000,
    monthlyTarget: 1000000,
    approvalRate: 95.8,
    pendingCount: 5,
    overdueCount: 0,
    averageTicket: 68000,
    totalTax: 168000,
    totalExpenses: 120000,
    totalManualIncome: 50000,
    totalRevenue: 980000,
    netProfit: 692000,
  },
};

export const LowPerformance: Story = {
  args: {
    totalVolume: 250000,
    monthlyTarget: 800000,
    approvalRate: 62.5,
    pendingCount: 25,
    overdueCount: 10,
    averageTicket: 32000,
    totalTax: 35000,
    totalExpenses: 95000,
    totalManualIncome: 10000,
    totalRevenue: 225000,
    netProfit: 95000,
  },
};

export const WithoutTarget: Story = {
  args: {
    totalVolume: 450000,
    approvalRate: 78.2,
    pendingCount: 15,
    overdueCount: 4,
    averageTicket: 40000,
    totalTax: 63000,
    totalExpenses: 72000,
    totalManualIncome: 18000,
    totalRevenue: 395000,
    netProfit: 260000,
  },
};
