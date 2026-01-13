"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Input, Badge, SimpleSelect } from "@lifecalling/ui";
import { Calculator, Plus, Trash2, AlertCircle } from "lucide-react";
import type { SimulationBankInput, SimulationInput } from "@/lib/types/simulation";
import { formatCurrency, parseCurrency, formatCurrencyInput, calculateValorLiberado, validateCoeficiente } from "@/lib/utils/currency";

const BANKS = [
  "SANTANDER",
  "BRADESCO",
  "ITAU",
  "BANCO_DO_BRASIL",
  "CAIXA",
  "SICOOB",
  "SICREDI",
  "PAN",
  "ORIGINAL",
  "SAFRA",
  "BMG",
  "DAYCOVAL",
  "C6",
  "INTER",
  "NUBANK",
  "NEON",
  "BANRISUL",
  "BRB",
  "MERCANTIL",
  "VOTORANTIM",
  "PINE",
  "MASTER",
  "OLÉ_CONSIGNADO",
  "FACTA",
  "DIGIO",
  "BIB",
  "Margem*",
  "Margem Positiva"
];

const PRODUCTS = [
  { value: "emprestimo_consignado", label: "Empréstimo Consignado" },
  { value: "cartao_beneficio", label: "Cartão Benefício" },
  { value: "cartao_consignado", label: "Cartão Consignado" },
  { value: "abase_auxilio", label: "Abase Auxílio" },
  { value: "nenhum", label: "Nenhum" },
  { value: "outro", label: "Outro" }
];

const isMarginBankName = (bankName?: string) => {
  const normalized = (bankName || "").trim().toLowerCase();
  return normalized === "margem*" || normalized === "margem negativa" || normalized === "margem positiva";
};

interface SimulationFormMultiBankProps {
  onCalculate?: (data: SimulationInput) => void;
  loading?: boolean;
  className?: string;
  initialData?: SimulationInput;
}

export function SimulationFormMultiBank({
  onCalculate,
  loading = false,
  className,
  initialData
}: SimulationFormMultiBankProps) {
  const [banks, setBanks] = useState<SimulationBankInput[]>([
    { bank: "SANTANDER", product: "emprestimo_consignado", parcela: 0, saldoDevedor: 0, valorLiberado: 0 }
  ]);

  const [formData, setFormData] = useState({
    prazo: 96,
    coeficiente: "",
    seguro: 0,
    percentualConsultoria: 12
  });


  const [inputValues, setInputValues] = useState<{
    [key: string]: {
      parcela: string;
      saldoDevedor: string;
    }
  }>({});

  const [globalInputs, setGlobalInputs] = useState({
    seguro: "",
    percentualConsultoria: "12,00"
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Preencher formulário quando initialData mudar (edição de histórico)
  useEffect(() => {
    if (initialData) {
      const normalizedBanks = initialData.banks.map((bank) => {
        if (isMarginBankName(bank.bank)) {
          // Para Margem* (negativa): valor liberado = negativo da parcela
          // Para Margem Positiva: valor liberado = positivo da parcela
          const normalized = (bank.bank || "").trim().toLowerCase();
          const isNegativeMargin = normalized === "margem*" || normalized === "margem negativa";
          const valorLiberado = isNegativeMargin ? -Math.abs(bank.parcela) : Math.abs(bank.parcela);
          return { ...bank, valorLiberado };
        }
        return bank;
      });
      // Atualizar bancos
      setBanks(
        normalizedBanks.map((b) => ({
          ...b,
          product: b.product || "emprestimo_consignado"
        }))
      );

      // Atualizar formData global
      setFormData({
        prazo: initialData.prazo,
        coeficiente: initialData.coeficiente,
        seguro: initialData.seguro,
        percentualConsultoria: initialData.percentualConsultoria
      });

      // Atualizar inputs formatados para cada banco
      const newInputValues: { [key: string]: { parcela: string; saldoDevedor: string } } = {};
      normalizedBanks.forEach((bank, index) => {
        newInputValues[index] = {
          parcela: formatCurrency(bank.parcela),
          saldoDevedor: formatCurrency(bank.saldoDevedor)
        };
      });
      setInputValues(newInputValues);

      // Atualizar inputs globais formatados
      setGlobalInputs({
        seguro: formatCurrency(initialData.seguro),
        percentualConsultoria: initialData.percentualConsultoria.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    }
  }, [initialData]);

  const addBank = () => {
    if (banks.length < 6) {
      setBanks([
        ...banks,
        { bank: "SANTANDER", product: "emprestimo_consignado", parcela: 0, saldoDevedor: 0, valorLiberado: 0 }
      ]);
    }
  };

  const removeBank = (index: number) => {
    if (banks.length > 1) {
      setBanks(banks.filter((_, i) => i !== index));
    }
  };

  const updateBank = (index: number, field: string, value: any) => {
    const newBanks = [...banks];

    if (field === 'parcela' || field === 'saldoDevedor') {
      // Permitir valores negativos para bancos Margem* e Margem Positiva
      const currentBank = newBanks[index];
      const allowNegative = isMarginBankName(currentBank.bank);
      
      const formattedValue = formatCurrencyInput(value, allowNegative);
      const numericValue = parseCurrency(formattedValue, allowNegative);
      
      // Validar se o valor é negativo e não é permitido
      if (numericValue < 0 && !allowNegative) {
        // Se valor negativo não é permitido, usar valor absoluto
        const positiveValue = Math.abs(numericValue);
        const positiveFormatted = formatCurrency(positiveValue);
        
        setInputValues(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: positiveFormatted
          }
        }));
        
        newBanks[index] = { ...newBanks[index], [field]: positiveValue };
      } else {
        // Valor é válido (positivo ou negativo permitido)
        setInputValues(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: formattedValue
          }
        }));
        
        newBanks[index] = { ...newBanks[index], [field]: numericValue };
      }

    } else if (field === 'coeficiente') {
      // coeficiente é um campo global, não por banco
      setFormData(prev => ({ ...prev, coeficiente: value }));

      // Recalcular valor liberado quando coeficiente mudar
      const bank = newBanks[index];
      if (bank.parcela !== undefined && bank.saldoDevedor !== undefined && value !== undefined && !isMarginBankName(bank.bank)) {
        let valorLiberado = calculateValorLiberado(bank.parcela, value, bank.saldoDevedor);

        // Aplicar a mesma regra de valores negativos para o valor liberado calculado
        const allowNegative = isMarginBankName(bank.bank);
        if (valorLiberado < 0 && !allowNegative) {
          valorLiberado = Math.abs(valorLiberado);
        }
        
        newBanks[index] = { ...newBanks[index], valorLiberado };

        setInputValues(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            valorLiberado: formatCurrency(valorLiberado)
          }
        }));
      }
    } else if (field === 'bank') {
      // Quando o banco é alterado, recalcular valor liberado
      newBanks[index] = { ...newBanks[index], [field]: value };
      const bankAfterUpdate = newBanks[index];

      if (isMarginBankName(value)) {
        // Se mudou para banco Margem, calcular valor liberado baseado na parcela
        const normalized = (value || "").trim().toLowerCase();
        const isNegativeMargin = normalized === "margem*" || normalized === "margem negativa";
        if (bankAfterUpdate.parcela !== undefined) {
          const valorLiberado = isNegativeMargin ? -Math.abs(bankAfterUpdate.parcela) : Math.abs(bankAfterUpdate.parcela);
          newBanks[index] = { ...bankAfterUpdate, valorLiberado };
        } else {
          newBanks[index] = { ...bankAfterUpdate, valorLiberado: 0 };
        }
      } else if (bankAfterUpdate.parcela && bankAfterUpdate.saldoDevedor !== undefined && formData.coeficiente) {
        // Se mudou para banco normal, recalcular com coeficiente
        let valorLiberado = calculateValorLiberado(
          bankAfterUpdate.parcela,
          parseFloat(formData.coeficiente.replace(',', '.')),
          bankAfterUpdate.saldoDevedor
        );
        if (valorLiberado < 0) {
          valorLiberado = Math.abs(valorLiberado);
        }
        newBanks[index] = { ...bankAfterUpdate, valorLiberado };
      }
    } else {
      newBanks[index] = { ...newBanks[index], [field]: value };
    }

    const updatedBank = newBanks[index];
    if (isMarginBankName(updatedBank.bank)) {
      // Para Margem* (negativa): valor liberado = negativo da parcela
      // Para Margem Positiva: valor liberado = positivo da parcela
      const normalized = (updatedBank.bank || "").trim().toLowerCase();
      const isNegativeMargin = normalized === "margem*" || normalized === "margem negativa";

      if (field === 'parcela' && updatedBank.parcela !== undefined) {
        const valorLiberado = isNegativeMargin ? -Math.abs(updatedBank.parcela) : Math.abs(updatedBank.parcela);
        newBanks[index] = { ...updatedBank, valorLiberado };
      } else {
        // Manter valor liberado atual se não estiver atualizando parcela
        newBanks[index] = { ...updatedBank };
      }
    } else if (field === 'parcela' || field === 'saldoDevedor') {
      if (updatedBank.parcela !== undefined && updatedBank.saldoDevedor !== undefined && formData.coeficiente !== undefined && formData.coeficiente !== "") {
        let valorLiberado = calculateValorLiberado(
          updatedBank.parcela,
          parseFloat(formData.coeficiente.replace(',', '.')),
          updatedBank.saldoDevedor
        );

        if (valorLiberado < 0) {
          valorLiberado = Math.abs(valorLiberado);
        }

        newBanks[index] = { ...newBanks[index], valorLiberado };
      }
    }

    setBanks(newBanks);
  };

  // Remover o useEffect que calculava automaticamente o valor liberado
  // O valor liberado agora deve ser informado manualmente pelo usuário

  const handleGlobalInputChange = (field: string, value: string) => {
    if (field === 'seguro') {
      const formattedValue = formatCurrencyInput(value);
      setGlobalInputs(prev => ({ ...prev, seguro: formattedValue }));
      setFormData(prev => ({ ...prev, seguro: parseCurrency(formattedValue) }));
    } else if (field === 'percentualConsultoria') {
      // Formatar como percentual
      const numbers = value.replace(/\D/g, '');
      if (numbers) {
        const num = parseInt(numbers) / 100;
        const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setGlobalInputs(prev => ({ ...prev, percentualConsultoria: formatted }));
        setFormData(prev => ({ ...prev, percentualConsultoria: num }));
      } else {
        setGlobalInputs(prev => ({ ...prev, percentualConsultoria: "" }));
        setFormData(prev => ({ ...prev, percentualConsultoria: 0 }));
      }
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Validar se há pelo menos um banco
    if (banks.length === 0) {
      errors.push("Adicione pelo menos um banco");
    }

    // Validar cada banco
    banks.forEach((bank, index) => {
      if (!bank.product) {
        errors.push(`Banco ${index + 1}: Selecione um produto`);
      }
      if (!bank.bank) {
        errors.push(`Banco ${index + 1}: Selecione um banco`);
      }

      // Para bancos Margem* e Margem Positiva, permitir qualquer valor (incluindo zero e negativos)
      if (!isMarginBankName(bank.bank)) {
        // Para outros bancos, validar que parcela seja maior que zero
        if (!bank.parcela || bank.parcela <= 0) {
          errors.push(`Banco ${index + 1}: Parcela deve ser maior que zero`);
        }

        // Para outros bancos, validar que saldo devedor não seja negativo
        if (bank.saldoDevedor < 0) {
          errors.push(`Banco ${index + 1}: Saldo devedor não pode ser negativo`);
        }

        // Para outros bancos, validar que valor liberado seja maior que zero
        if (!bank.valorLiberado || bank.valorLiberado <= 0) {
          errors.push(`Banco ${index + 1}: Valor liberado deve ser informado e maior que zero`);
        }
      }
    });

    // Validar dados globais
    if (!formData.prazo || formData.prazo <= 0) {
      errors.push("Prazo deve ser maior que zero");
    }

    if (!formData.coeficiente || !validateCoeficiente(formData.coeficiente)) {
      errors.push("Coeficiente deve ser informado no formato correto (ex: 0,0192223)");
    }

    if (formData.seguro < 0) {
      errors.push("Seguro não pode ser negativo");
    }

    if (formData.percentualConsultoria < 0 || formData.percentualConsultoria > 100) {
      errors.push("Percentual de consultoria deve estar entre 0 e 100");
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const simulationData: SimulationInput = {
        banks: banks.map((b) => ({
          ...b,
          product: b.product || "emprestimo_consignado"
        })),
        prazo: formData.prazo,
        coeficiente: formData.coeficiente,
        seguro: formData.seguro,
        percentualConsultoria: formData.percentualConsultoria
      };

      onCalculate?.(simulationData);
    }
  };

  return (
    <Card className={`w-full ${className || ''}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Simulação Multi-Bancos
          </h3>
          <Badge variant="outline" data-testid="banks-count">
            {banks.length}/6 bancos
          </Badge>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md" data-testid="validation-errors">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Corrija os seguintes erros:</p>
                <ul className="text-xs text-destructive mt-1 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Globais - Movido para o topo */}
          <div className="space-y-4">
            <h4 className="font-medium border-b pb-2">Dados Globais</h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Coeficiente *</label>
              <Input
                type="text"
                value={formData.coeficiente}
                onChange={(e) => setFormData({ ...formData, coeficiente: e.target.value })}
                placeholder="0,0192223"
                data-testid="coeficiente"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para calcular automaticamente o valor liberado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prazo *</label>
              <Input
                type="number"
                value={formData.prazo || ""}
                onChange={(e) => setFormData({ ...formData, prazo: Number(e.target.value) || 0 })}
                placeholder="96"
                min={1}
                max={240}
                data-testid="prazo"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Em meses (ex: 96)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">% Consultoria</label>
              <Input
                type="text"
                value={globalInputs.percentualConsultoria}
                  onChange={(e) => handleGlobalInputChange('percentualConsultoria', e.target.value)}
                  placeholder="12,00"
                  data-testid="percentual-consultoria"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custo = Total Financiado × %
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Seguro</label>
                <Input
                  type="text"
                  value={globalInputs.seguro}
                  onChange={(e) => handleGlobalInputChange('seguro', e.target.value)}
                  placeholder="R$ 1.000,00"
                  data-testid="seguro"
                />
              </div>
            </div>
          </div>

          {/* Bancos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bancos</h4>
              <Button
                type="button"
                onClick={addBank}
                disabled={banks.length >= 6}
                variant="outline"
                size="sm"
                data-testid="add-bank-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Banco
              </Button>
            </div>

            {banks.map((bank, index) => (
              <Card key={index} className="p-4 border-l-4 border-l-primary">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Banco {index + 1}</h5>
                    {banks.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeBank(index)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Produto *</label>
                      <SimpleSelect
                        value={bank.product || "emprestimo_consignado"}
                        onValueChange={(value) => updateBank(index, "product", value)}
                        data-testid={`bank-${index}-product`}
                        required
                      >
                        {PRODUCTS.map((prod) => (
                          <option key={prod.value} value={prod.value}>
                            {prod.label}
                          </option>
                        ))}
                      </SimpleSelect>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Banco *</label>
                      <SimpleSelect
                        value={bank.bank}
                        onValueChange={(value) => updateBank(index, "bank", value)}
                        data-testid={`bank-${index}-select`}
                        required
                      >
                        {BANKS.map((bankName) => (
                          <option key={bankName} value={bankName}>
                            {bankName.replace(/_/g, " ")}
                          </option>
                        ))}
                      </SimpleSelect>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Parcela *</label>
                      <Input
                        type="text"
                        value={inputValues[index]?.parcela || ""}
                        onChange={(e) => updateBank(index, "parcela", e.target.value)}
                        placeholder="R$ 1.000,00"
                        data-testid={`bank-${index}-parcela`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Saldo Devedor
                      </label>
                      <Input
                        type="text"
                        value={inputValues[index]?.saldoDevedor || ""}
                        onChange={(e) => updateBank(index, "saldoDevedor", e.target.value)}
                        placeholder="R$ 30.000,00"
                        data-testid={`bank-${index}-saldo-devedor`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Valor Liberado *</label>
                      <Input
                        type="text"
                        value={formatCurrency(bank.valorLiberado || 0)}
                        placeholder="R$ 0,00"
                        data-testid={`bank-${index}-valor-liberado`}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Calculado automaticamente com base no coeficiente
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="border-t pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
              data-testid="calculate-button"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Simulação
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
