/* packages/ui/src/FinanceCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, TrendingUp, AlertCircle } from "lucide-react";

export interface FinanceCardProps {
  id: number;
  clientName: string;
  totalAmount: number;
  installedAmount?: number;
  installments: number;
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
  const [disbursementAmount, setDisbursementAmount] = React.useState(totalAmount);
  const [disbursementInstallments, setDisbursementInstallments] = React.useState(installments);

  const progress = installments > 0 ? (paidInstallments / installments) * 100 : 0;

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
            <span className="text-sm text-muted-foreground">Valor Total</span>
          </div>
          <p className="font-semibold text-lg text-green-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Parcelas</span>
          </div>
          <p className="font-semibold">
            {paidInstallments}/{installments}
          </p>
        </div>
      </div>

      {/* Progress Bar for disbursed contracts */}
      {status === "disbursed" && (
        <div className="space-y-2">
          <ProgressBar
            value={paidInstallments}
            max={installments}
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