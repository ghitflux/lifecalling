/* packages/ui/src/FinanceCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, TrendingUp, AlertCircle } from "lucide-react";

interface SimulationResult {
  banco?: string;
  valorLiberado: number;
  valorParcela: number;
  coeficiente?: number;
  saldoDevedor?: number;
  valorTotalFinanciado?: number;
  seguroObrigatorio?: number;
  valorLiquido?: number;
  custoConsultoria?: number;
  liberadoCliente: number;
  percentualConsultoria?: number;
  taxaJuros: number;
  prazo: number;
}

export interface FinanceCardProps {
  id: number;
  clientName: string;
  simulationResult?: SimulationResult;
  // Mantendo compatibilidade com props antigas
  totalAmount?: number;
  installedAmount?: number;
  installments?: number;
  paidInstallments?: number;
  status: "pending" | "approved" | "disbursed" | "overdue";
  dueDate?: string;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDisburse?: (id: number, amount: number, installments: number) => void;
  className?: string;
}

export function FinanceCard({
  id,
  clientName,
  simulationResult,
  totalAmount,
  installedAmount = 0,
  installments,
  paidInstallments = 0,
  status,
  dueDate,
  onApprove,
  onReject,
  onDisburse,
  className
}: FinanceCardProps) {
  // Usar dados da simulação quando disponível, caso contrário usar props antigas
  const finalTotalAmount = simulationResult?.valorLiberado || totalAmount || 0;
  const finalInstallments = simulationResult?.prazo || installments || 0;
  const finalMonthlyPayment = simulationResult?.valorParcela || 0;

  const [disbursementAmount, setDisbursementAmount] = React.useState(finalTotalAmount);
  const [disbursementInstallments, setDisbursementInstallments] = React.useState(finalInstallments);

  const progress = finalInstallments > 0 ? (paidInstallments / finalInstallments) * 100 : 0;

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    disbursed: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pending: "Pendente",
    approved: "Aprovado",
    disbursed: "Liberado",
    overdue: "Em atraso"
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{clientName}</h3>
          <p className="text-sm text-muted-foreground">Caso #{id}</p>
          {simulationResult?.banco && (
            <div className="bg-primary/10 px-2 py-1 rounded-md">
              <span className="text-xs font-medium text-primary">{simulationResult.banco}</span>
            </div>
          )}
        </div>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Valor Liberado</span>
          </div>
          <p className="font-semibold text-lg text-green-600">
            {formatCurrency(finalTotalAmount)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Parcelas</span>
          </div>
          <p className="font-semibold">
            {paidInstallments}/{finalInstallments}
          </p>
        </div>

        {simulationResult && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Valor Parcela</span>
              </div>
              <p className="font-semibold">
                {formatCurrency(finalMonthlyPayment)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Liberado Cliente</span>
              </div>
              <p className="font-semibold text-green-600">
                {formatCurrency(simulationResult.liberadoCliente)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Seção adicional com dados da simulação */}
      {simulationResult && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {simulationResult.valorTotalFinanciado && (
              <div>
                <span className="text-muted-foreground">Total Financiado: </span>
                <span className="font-medium">{formatCurrency(simulationResult.valorTotalFinanciado)}</span>
              </div>
            )}
            {simulationResult.custoConsultoria && (
              <div>
                <span className="text-muted-foreground">Custo Consultoria: </span>
                <span className="font-medium">{formatCurrency(simulationResult.custoConsultoria)}</span>
              </div>
            )}
            {simulationResult.taxaJuros && (
              <div>
                <span className="text-muted-foreground">Taxa Juros: </span>
                <span className="font-medium">{simulationResult.taxaJuros}% a.m.</span>
              </div>
            )}
            {simulationResult.coeficiente && (
              <div>
                <span className="text-muted-foreground">Coeficiente: </span>
                <span className="font-mono font-medium">{simulationResult.coeficiente.toFixed(7)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar for disbursed contracts */}
      {status === "disbursed" && (
        <div className="space-y-2">
          <ProgressBar
            value={paidInstallments}
            max={finalInstallments}
            variant={progress < 30 ? "danger" : progress < 70 ? "warning" : "success"}
            showLabel
            label="Progresso de Pagamento"
          />
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Vencimento: {formatDate(dueDate)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {status === "pending" && (onApprove || onReject) && (
          <>
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(id)}
                className="flex-1"
              >
                Aprovar
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(id)}
                className="flex-1"
              >
                Rejeitar
              </Button>
            )}
          </>
        )}

        {status === "approved" && onDisburse && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Valor</label>
                <input
                  type="number"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Parcelas</label>
                <input
                  type="number"
                  value={disbursementInstallments}
                  onChange={(e) => setDisbursementInstallments(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onDisburse(id, disbursementAmount, disbursementInstallments)}
              className="w-full"
              disabled={disbursementAmount <= 0 || disbursementInstallments <= 0}
            >
              Efetivar Liberação
            </Button>
          </div>
        )}

        {status === "overdue" && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Necessita atenção - Pagamento em atraso</span>
          </div>
        )}
      </div>
    </Card>
  );
}