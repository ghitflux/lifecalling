import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { KPICard } from "../KPICard";
import { TrendingUp } from "lucide-react";

const meta: Meta<typeof KPICard> = {
  title: "Analytics/KPICard",
  component: KPICard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: {
    title: "Atendimentos Abertos",
    value: 128,
    subtitle: "Últimos 7 dias",
    trend: 12.4,
    gradientVariant: "emerald",
    icon: TrendingUp,
  },
};

export const Loading: Story = {
  args: {
    title: "Conversão",
    value: "—",
    subtitle: "Atualizando métricas",
    isLoading: true,
    gradientVariant: "sky",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <KPICard title="TMA" value="18 min" subtitle="Tempo médio" trend={-4.2} gradientVariant="violet" />
      <KPICard title="SLA 72h" value="92%" subtitle="Dentro do prazo" trend={1.8} gradientVariant="emerald" />
      <KPICard title="Resultado MTD" value="R$ 187k" subtitle="Mês corrente" trend={3.1} gradientVariant="rose" />
    </div>
  ),
};
