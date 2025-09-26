/* packages/ui/src/SimulationForm.tsx */
"use client";
import React, { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";

interface FormData {
  banco: string;
  parcelas: string;
  saldo: string;
  parcela: string;
  seguro: string;
  percentOperacao: string;
  percentConsultoria: string;
  coeficiente: string;
}

interface SimulationFormProps {
  initialData?: Partial<FormData>;
  onSubmit?: (data: FormData) => void;
  onApprove?: (data: FormData) => void;
  onReject?: (data: FormData) => void;
  loading?: boolean;
  showActions?: boolean;
}

export function SimulationForm({
  initialData = {},
  onSubmit,
  onApprove,
  onReject,
  loading = false,
  showActions = true
}: SimulationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    banco: "Santander",
    parcelas: "60",
    saldo: "50000",
    parcela: "1200",
    seguro: "50",
    percentOperacao: "2.5",
    percentConsultoria: "1.5",
    coeficiente: "",
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const calculateCoefficient = () => {
    const n = parseInt(formData.parcelas);
    const i = parseFloat(formData.percentOperacao) / 100;
    const coef = i / (1 - Math.pow(1 + i, -n));
    setFormData({ ...formData, coeficiente: coef.toFixed(6) });
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Simulação de Empréstimo</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Banco</label>
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
              <label className="block text-sm font-medium mb-1">Parcelas</label>
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
              <label className="block text-sm font-medium mb-1">Saldo Devedor (R$)</label>
              <Input
                type="number"
                value={formData.saldo}
                onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Parcela (R$)</label>
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
              <label className="block text-sm font-medium mb-1">Seguro (R$)</label>
              <Input
                type="number"
                value={formData.seguro}
                onChange={(e) => setFormData({ ...formData, seguro: e.target.value })}
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">% Operação/Mês</label>
              <Input
                type="number"
                step="0.1"
                value={formData.percentOperacao}
                onChange={(e) => setFormData({ ...formData, percentOperacao: e.target.value })}
                placeholder="2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">% Consultoria</label>
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
              <label className="block text-sm font-medium mb-1">Coeficiente</label>
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

          {showActions && (
            <div className="flex gap-2 pt-4">
              {onApprove && (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => onApprove(formData)}
                  disabled={loading}
                >
                  {loading ? "Aprovando..." : "Aprovar Simulação"}
                </Button>
              )}
              {onReject && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onReject(formData)}
                  disabled={loading}
                >
                  {loading ? "Reprovando..." : "Reprovar Simulação"}
                </Button>
              )}
              {onSubmit && !onApprove && !onReject && (
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Simulação"}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </Card>
  );
}