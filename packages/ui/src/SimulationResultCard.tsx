"use client";

import React from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Calculator, TrendingUp, DollarSign, Wallet, User } from "lucide-react";

// Tipos para simulação
interface SimulationBankInput {
  bank: string;
  parcela: number;
  saldoDevedor: number;
  valorLiberado: number;
}

interface SimulationInput {
  banks: SimulationBankInput[];
  prazo: number;
  coeficiente: string;
  seguro: number;
  percentualConsultoria: number;
}

interface SimulationTotals {
  valorParcelaTotal: number;
  saldoTotal: number;
  liberadoTotal: number;
  seguroObrigatorio?: number; // NOVO: Seguro Obrigatório Banco
  totalFinanciado: number;
  valorLiquido: number;
  custoConsultoria: number;
  custoConsultoriaLiquido?: number;
  liberadoCliente: number;
}

interface SimulationResultCardProps {
  totals: SimulationTotals;
  simulation?: SimulationInput | null;
  isActive?: boolean;
  className?: string;
  atendente?: string | null;
}

export function SimulationResultCard({
  totals,
  simulation,
  isActive = false,
  className = "",
  atendente
}: SimulationResultCardProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const ResultItem: React.FC<{
    label: string;
    value: number;
    highlight?: boolean;
    icon?: React.ReactNode;
    isNegative?: boolean;
  }> = ({ label, value, highlight = false, icon, isNegative = false }) => {
    const isValueNegative = value < 0;
    const shouldBeRed = isNegative && isValueNegative;

    return (
      <div
        className={`flex items-center justify-between py-2 ${
          highlight
            ? shouldBeRed
              ? 'rounded-lg border border-danger/40 bg-danger-subtle px-3'
              : 'rounded-lg border border-success/40 bg-success-subtle px-3'
            : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span
            className={`text-sm ${
              highlight
                ? shouldBeRed
                  ? 'font-semibold text-danger-foreground'
                  : 'font-semibold text-success-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
        </div>
        <span
          className={`font-mono ${
            highlight
              ? shouldBeRed
                ? 'text-lg font-bold text-danger'
                : 'text-lg font-bold text-success'
              : 'font-medium'
          }`}
        >
          {formatCurrency(value)}
        </span>
      </div>
    );
  };

  return (
    <Card className={`w-full ${isActive ? 'ring-2 ring-primary' : ''} ${className}`} data-testid="simulation-result">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Resultado da Simulação
          </h3>
          <Badge variant="outline" className="text-success">
            Calculado ✓
          </Badge>
        </div>

        {/* Atendente responsável */}
        {atendente && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Atribuído a:
              </span>
              <span className="text-sm font-semibold">{atendente}</span>
            </div>
          </div>
        )}

        {/* Resumo dos Bancos */}
        {simulation && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg" data-testid="banks-summary">
            <p className="text-sm font-medium mb-2">Bancos incluídos:</p>
            <div className="flex flex-wrap gap-1">
              {simulation.banks.map((bank, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {bank.bank.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
              <div>Prazo: {simulation.prazo} meses</div>
              <div>% Consultoria: {simulation.percentualConsultoria}%</div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {/* Totais por categoria */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Totais dos Bancos
            </h4>

            <div data-testid="valor-parcela-total">
              <ResultItem
                label="Valor Parcela Total"
                value={totals.valorParcelaTotal}
              />
            </div>
            <div data-testid="saldo-total">
              <ResultItem
                label="Saldo Devedor Total"
                value={totals.saldoTotal}
              />
            </div>
            <div data-testid="liberado-total">
              <ResultItem
                label="Valor Liberado Total"
                value={totals.liberadoTotal}
              />
            </div>
            {totals.seguroObrigatorio !== undefined && (
              <div data-testid="seguro-obrigatorio">
                <ResultItem
                  label="Seguro Obrigatório Banco"
                  value={totals.seguroObrigatorio}
                />
              </div>
            )}
          </div>

          <div className="border-t my-3"></div>

          {/* Cálculos financeiros */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Cálculos Financeiros
            </h4>

            <div data-testid="total-financiado">
              <ResultItem
                label="Valor Total Financiado"
                value={totals.totalFinanciado}
              />
            </div>
            <div data-testid="valor-liquido">
              <ResultItem
                label="Valor Líquido"
                value={totals.valorLiquido}
              />
            </div>
            <div data-testid="custo-consultoria">
              <ResultItem
                label="Custo Consultoria"
                value={totals.custoConsultoria}
              />
            </div>
            {totals.custoConsultoriaLiquido !== undefined && (
              <div data-testid="custo-consultoria-liquido">
                <ResultItem
                  label="Custo Consultoria Líquido (86%)"
                  value={totals.custoConsultoriaLiquido}
                />
              </div>
            )}
          </div>

          <div className="border-t my-3"></div>

          {/* Resultado final */}
          <div data-testid="liberado-cliente">
            <ResultItem
              label="Liberado para o Cliente"
              value={totals.liberadoCliente}
              highlight={true}
              isNegative={true}
              icon={<Wallet className={`h-4 w-4 ${totals.liberadoCliente < 0 ? 'text-danger' : 'text-success'}`} />}
            />
          </div>
        </div>

        {/* Validação do cenário de teste */}
        {simulation && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Fórmulas: Total Financiado = Saldo + Liberado |
              Valor Líquido = Liberado - Seguro |
              Custo = Total × % |
              Cliente = Líquido - Custo
            </p>

            {/* Verificação do cenário de teste da planilha */}
            {simulation.prazo === 96 &&
             simulation.percentualConsultoria === 12 &&
             simulation.seguro === 1000 &&
             simulation.banks.length === 1 &&
             simulation.banks[0].parcela === 1000 &&
             simulation.banks[0].saldoDevedor === 30000 &&
             Math.abs(simulation.banks[0].valorLiberado - 22022.91) < 0.01 && (
              <div
                className="mt-2 rounded border border-success/40 bg-success-subtle p-2 text-success-foreground"
                data-testid="reference-scenario-validation"
              >
                ✓ Cenário de teste validado: R$ {formatCurrency(totals.liberadoCliente)}
                {Math.abs(totals.liberadoCliente - 14780.16) < 0.01 ?
                  " (Conforme planilha de referência)" :
                  " (ATENÇÃO: Diverge da planilha de referência)"
                }
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
