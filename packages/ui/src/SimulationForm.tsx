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
  seguro: string;
  percentOperacao: string;
  percentConsultoria: string;
  coeficiente: string;
}

interface SimulationFormProps {
  initialData?: Partial<FormData>;
  onSubmit?: (data: FormData) => void;
  loading?: boolean;
  onChange?: (data: FormData) => void;
}

export function SimulationForm({
  initialData = {},
  onSubmit,
  loading = false,
  onChange
}: SimulationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    banco: "SANTANDER",
    parcelas: "96",
    saldo: "30000",
    seguro: "1000",
    percentOperacao: "2.5",
    percentConsultoria: "12",
    coeficiente: "",
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const updateFormData = (updates: Partial<FormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onChange?.(newData);
  };

  const calculateCoefficient = () => {
    const n = parseInt(formData.parcelas);
    const i = parseFloat(formData.percentOperacao) / 100;
    const coef = i / (1 - Math.pow(1 + i, -n));
    updateFormData({ coeficiente: coef.toFixed(6) });
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Simulação de Empréstimo</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-primary font-semibold">Banco *</label>
            <select
              value={formData.banco}
              onChange={(e) => updateFormData({ banco: e.target.value })}
              className="w-full p-3 border rounded-md bg-background font-medium"
              required
            >
              <option value="SANTANDER">SANTANDER</option>
              <option value="BRADESCO">BRADESCO</option>
              <option value="ITAU">ITAÚ</option>
              <option value="CAIXA">CAIXA</option>
              <option value="BANCO_DO_BRASIL">BANCO DO BRASIL</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número de Parcelas</label>
              <Input
                type="number"
                value={formData.parcelas}
                onChange={(e) => updateFormData({ parcelas: e.target.value })}
                placeholder="96"
                min="1"
                max="240"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Saldo Devedor (R$)</label>
              <Input
                type="number"
                value={formData.saldo}
                onChange={(e) => updateFormData({ saldo: e.target.value })}
                placeholder="30.000,00"
                min="0"
                step="0.01"
              />
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor do Seguro (R$)</label>
              <Input
                type="number"
                value={formData.seguro}
                onChange={(e) => updateFormData({ seguro: e.target.value })}
                placeholder="1.000,00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">% Percentual da Operação</label>
              <Input
                type="number"
                step="0.01"
                value={formData.percentOperacao}
                onChange={(e) => updateFormData({ percentOperacao: e.target.value })}
                placeholder="2,50"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Coeficiente (calculado)</label>
                <Input
                  type="number"
                  step="0.0000001"
                  value={formData.coeficiente}
                  onChange={(e) => updateFormData({ coeficiente: e.target.value })}
                  placeholder="Será calculado automaticamente"
                  className="font-mono"
                />
              </div>
              <Button type="button" onClick={calculateCoefficient} variant="outline">
                Calcular PRICE
              </Button>
            </div>
          </div>

          {onSubmit && (
            <div className="border-t pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Calcular Simulação"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
}