import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "@lifecalling/ui";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "select" },
      options: [
        "novo",
        "em_atendimento",
        "aguardando_aprovacao",
        "aprovado",
        "reprovado",
        "calculista_pendente",
        "fechamento_pendente",
        "financeiro_pendente",
        "contrato_efetivado",
        "encerrado",
      ],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Novo: Story = {
  args: {
    status: "novo",
  },
};

export const EmAtendimento: Story = {
  args: {
    status: "em_atendimento",
  },
};

export const AguardandoAprovacao: Story = {
  args: {
    status: "aguardando_aprovacao",
  },
};

export const Aprovado: Story = {
  args: {
    status: "aprovado",
  },
};

export const Reprovado: Story = {
  args: {
    status: "reprovado",
  },
};

export const CalculistaPendente: Story = {
  args: {
    status: "calculista_pendente",
    size: "default"
  },
};

export const ContratoEfetivado: Story = {
  args: {
    status: "contrato_efetivado",
  },
};

export const Encerrado: Story = {
  args: {
    status: "encerrado",
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="novo" />
      <StatusBadge status="em_atendimento" />
      <StatusBadge status="aguardando_aprovacao" />
      <StatusBadge status="aprovado" />
      <StatusBadge status="reprovado" />
      <StatusBadge status="calculista_pendente" />
      <StatusBadge status="fechamento_pendente" />
      <StatusBadge status="financeiro_pendente" />
      <StatusBadge status="contrato_efetivado" />
      <StatusBadge status="encerrado" />
    </div>
  ),
};
