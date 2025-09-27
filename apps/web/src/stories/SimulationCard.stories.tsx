import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SimulationCard } from "@lifecalling/ui";

const meta = {
  title: "Components/SimulationCard",
  component: SimulationCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isActive: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof SimulationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockResult = {
  valorLiberado: 50000,
  valorParcela: 1250,
  taxaJuros: 2.5,
  prazo: 48,
};

export const Default: Story = {
  args: {
    result: mockResult,
  },
};

export const Active: Story = {
  args: {
    result: mockResult,
    isActive: true,
  },
};

export const WithActions: Story = {
  args: {
    result: mockResult,
    onApprove: () => console.log("Approved"),
    onReject: () => console.log("Rejected"),
  },
};

export const ActiveWithActions: Story = {
  args: {
    result: mockResult,
    isActive: true,
    onApprove: () => console.log("Approved"),
    onReject: () => console.log("Rejected"),
  },
};

export const HighValue: Story = {
  args: {
    result: {
      valorLiberado: 150000,
      valorParcela: 3750,
      taxaJuros: 1.8,
      prazo: 60,
    },
    isActive: true,
    onApprove: () => console.log("High value approved"),
    onReject: () => console.log("High value rejected"),
  },
};

export const LowValue: Story = {
  args: {
    result: {
      valorLiberado: 10000,
      valorParcela: 350,
      taxaJuros: 3.2,
      prazo: 36,
    },
    onApprove: () => console.log("Low value approved"),
    onReject: () => console.log("Low value rejected"),
  },
};

export const ShortTerm: Story = {
  args: {
    result: {
      valorLiberado: 25000,
      valorParcela: 2100,
      taxaJuros: 2.0,
      prazo: 12,
    },
    isActive: true,
  },
};

export const LongTerm: Story = {
  args: {
    result: {
      valorLiberado: 80000,
      valorParcela: 1100,
      taxaJuros: 2.8,
      prazo: 84,
    },
  },
};
