import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
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
  banco: "Banco do Brasil",
  valorLiberado: 50000,
  valorParcela: 1250,
  coeficiente: 0.0260417,
  saldoDevedor: 45000,
  valorTotalFinanciado: 60000,
  seguroObrigatorio: 2500,
  valorLiquido: 47500,
  custoConsultoria: 6000,
  liberadoCliente: 44000,
  percentualConsultoria: 0.12,
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
      banco: "Banco do Brasil",
      valorLiberado: 150000,
      valorParcela: 3750,
      coeficiente: 0.0260417,
      saldoDevedor: 135000,
      valorTotalFinanciado: 180000,
      seguroObrigatorio: 7500,
      valorLiquido: 142500,
      custoConsultoria: 18000,
      liberadoCliente: 132000,
      percentualConsultoria: 0.12,
      taxaJuros: 1.8,
      prazo: 60,
    },
    isActive: true,
    onApprove: () => console.log("High value approved"),
    onReject: () => console.log("High value rejected"),
  },
};
