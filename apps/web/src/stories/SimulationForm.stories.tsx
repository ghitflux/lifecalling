import type { Meta, StoryObj } from "@storybook/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@lifecalling/ui";
import { fn } from "@storybook/test";
import { useState } from "react";

// Mock simulation form component
function SimulationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    banco: "Santander",
    parcelas: "60",
    saldo: "50000",
    parcela: "1200",
    seguro: "50",
    percentOperacao: "2.5",
    percentConsultoria: "1.5",
    coeficiente: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculateCoefficient = () => {
    const n = parseInt(formData.parcelas);
    const i = parseFloat(formData.percentOperacao) / 100;
    const coef = i / (1 - Math.pow(1 + i, -n));
    setFormData({ ...formData, coeficiente: coef.toFixed(6) });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Simulação de Empréstimo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Banco</label>
              <select
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option>Santander</option>
                <option>Bradesco</option>
                <option>Itaú</option>
                <option>Caixa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Parcelas</label>
              <Input
                type="number"
                value={formData.parcelas}
                onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                placeholder="60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Saldo Devedor (R$)</label>
              <Input
                type="number"
                value={formData.saldo}
                onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Parcela (R$)</label>
              <Input
                type="number"
                value={formData.parcela}
                onChange={(e) => setFormData({ ...formData, parcela: e.target.value })}
                placeholder="1200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Seguro (R$)</label>
              <Input
                type="number"
                value={formData.seguro}
                onChange={(e) => setFormData({ ...formData, seguro: e.target.value })}
                placeholder="50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">% Operação/Mês</label>
              <Input
                type="number"
                step="0.1"
                value={formData.percentOperacao}
                onChange={(e) => setFormData({ ...formData, percentOperacao: e.target.value })}
                placeholder="2.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">% Consultoria</label>
              <Input
                type="number"
                step="0.1"
                value={formData.percentConsultoria}
                onChange={(e) => setFormData({ ...formData, percentConsultoria: e.target.value })}
                placeholder="1.5"
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Coeficiente</label>
              <Input
                type="number"
                step="0.000001"
                value={formData.coeficiente}
                onChange={(e) => setFormData({ ...formData, coeficiente: e.target.value })}
                placeholder="Calculado automaticamente"
              />
            </div>
            <Button type="button" onClick={calculateCoefficient} variant="outline">
              Calcular PRICE
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Aprovar Simulação
            </Button>
            <Button type="button" variant="destructive" className="flex-1">
              Reprovar Simulação
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const meta = {
  title: "Forms/SimulationForm",
  component: SimulationForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof SimulationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: fn(),
  },
};

export const WithInteraction: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ args, canvasElement }) => {
    // Example of interaction testing (would need @storybook/addon-interactions)
    console.log("Form rendered successfully");
  },
};