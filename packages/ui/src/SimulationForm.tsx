/* packages/ui/src/SimulationForm.tsx */
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Badge } from "./Badge";
import {
  calculateSimulation,
  validateSimulationInput,
  type SimulationInput,
  type SimulationResult
} from "./lib/simulationUtils";
import { AlertCircle, Calculator } from "lucide-react";

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
  onCalculate?: (result: SimulationResult) => void;
  onSubmit?: (data: FormData) => void;
  loading?: boolean;
  onChange?: (data: FormData) => void;
  showCalculateButton?: boolean;
  autoCalculate?: boolean;
  className?: string;
}

export function SimulationForm({
  initialData = {},
  onCalculate,
  onSubmit,
  loading = false,
  onChange,
  showCalculateButton = true,
  autoCalculate = false,
  className
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

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastCalculationResult, setLastCalculationResult] = useState<SimulationResult | null>(null);

  // Converter FormData para SimulationInput
  const getSimulationInput = (): SimulationInput => ({
    banco: formData.banco,
    saldoDevedor: parseFloat(formData.saldo) || 0,
    parcelas: parseInt(formData.parcelas) || 0,
    taxaJuros: parseFloat(formData.percentOperacao) || 0,
    seguroObrigatorio: parseFloat(formData.seguro) || 0,
    percentualConsultoria: parseFloat(formData.percentConsultoria) || 0,
    coeficiente: parseFloat(formData.coeficiente) || undefined
  });

  // Validar e calcular simulação
  const calculateFullSimulation = () => {
    const input = getSimulationInput();
    const errors = validateSimulationInput(input);

    setValidationErrors(errors);

    if (errors.length === 0) {
      const result = calculateSimulation(input);
      setLastCalculationResult(result);

      // Atualizar coeficiente no formulário
      updateFormData({ coeficiente: result.coeficiente.toFixed(7) });

      // Notificar componente pai
      onCalculate?.(result);

      return result;
    }

    return null;
  };

  // Auto-calcular quando dados mudarem
  useEffect(() => {
    if (autoCalculate) {
      const input = getSimulationInput();
      const errors = validateSimulationInput(input);

      if (errors.length === 0) {
        const result = calculateSimulation(input);
        setLastCalculationResult(result);
        onCalculate?.(result);
      }
    }
  }, [formData, autoCalculate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showCalculateButton) {
      calculateFullSimulation();
    } else {
      onSubmit?.(formData);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onChange?.(newData);

    // Limpar erros quando usuário começar a digitar
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const calculateCoefficient = () => {
    const n = parseInt(formData.parcelas);
    const i = parseFloat(formData.percentOperacao) / 100;
    const coef = i / (1 - Math.pow(1 + i, -n));
    updateFormData({ coeficiente: coef.toFixed(7) });
  };

  const isFormValid = validationErrors.length === 0 &&
    formData.banco && formData.parcelas && formData.saldo &&
    formData.percentOperacao && formData.percentConsultoria;

  return (
    <Card className={`w-full ${className || ''}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Simulação de Empréstimo
          </h3>
          {lastCalculationResult && (
            <Badge variant="outline" className="text-green-600">
              Calculado ✓
            </Badge>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Corrija os seguintes erros:</p>
                <ul className="text-xs text-destructive mt-1 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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
              <label className="block text-sm font-medium mb-1">% Taxa de Juros Mensal</label>
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

          <div>
            <label className="block text-sm font-medium mb-1">% Percentual da Consultoria</label>
            <Input
              type="number"
              step="0.01"
              value={formData.percentConsultoria}
              onChange={(e) => updateFormData({ percentConsultoria: e.target.value })}
              placeholder="12,00"
              min="0"
              max="100"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Coeficiente PRICE</label>
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

          {showCalculateButton && (
            <div className="border-t pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isFormValid}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Simulação Completa
                  </>
                )}
              </Button>
            </div>
          )}

          {onSubmit && !showCalculateButton && (
            <div className="border-t pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Enviar"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
}