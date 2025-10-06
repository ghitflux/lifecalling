import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { GradientPanel } from "../GradientPanel";

const meta: Meta<typeof GradientPanel> = {
  title: "Analytics/GradientPanel",
  component: GradientPanel,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GradientPanel>;

export const Default: Story = {
  args: {
    title: "Overview",
    description: "Painel com borda e brilho gradiente.",
    children: (
      <div className="space-y-2 text-sm text-slate-300">
        <p>Use o GradientPanel como container para dados executivos.</p>
        <p>Ele já aplica halo, blur e borda translúcida de acordo com o tema.</p>
      </div>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <GradientPanel title="Emerald" description="Indicadores operacionais" variant="emerald">
        <p className="text-sm text-slate-200">Conteúdo livre para cards, gráficos ou tabelas.</p>
      </GradientPanel>
      <GradientPanel title="Rose" description="Alertas" variant="rose" actions={<button className="rounded-full bg-rose-500/80 px-3 py-1 text-xs text-white">Ação</button>}>
        <ul className="list-disc pl-4 text-sm text-slate-200">
          <li>2 filas acima do SLA</li>
          <li>1 job com falha recorrente</li>
        </ul>
      </GradientPanel>
    </div>
  ),
};
