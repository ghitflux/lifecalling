/* packages/ui/src/ContractCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { ToggleButton } from "./ToggleButton";
import { cn } from "./lib/utils";
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Download,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export interface ContractCardProps {
  id: number;
  clientName: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  status: "active" | "completed" | "overdue" | "cancelled";
  startDate: string;
  nextDueDate?: string;
  overdueAmount?: number;
  onViewDetails?: (id: number) => void;
  onDownloadContract?: (id: number) => void;
  onEditContract?: (id: number) => void;
  onTogglePayment?: (id: number, installment: number, paid: boolean) => void;
  className?: string;
}

export function ContractCard({
  id,
  clientName,
  totalAmount,
  installmentAmount,
  totalInstallments,
  paidInstallments,
  status,
  startDate,
  nextDueDate,
  overdueAmount = 0,
  onViewDetails,
  onDownloadContract,
  onEditContract,
  onTogglePayment,
  className
}: ContractCardProps) {
  const [showInstallments, setShowInstallments] = React.useState(false);

  const progress = (paidInstallments / totalInstallments) * 100;
  const remainingAmount = (totalInstallments - paidInstallments) * installmentAmount;

  const statusConfig = {
    active: {
      color: "border-info/40 bg-info-subtle text-info-foreground",
      icon: Clock,
      label: "Ativo"
    },
    completed: {
      color: "border-success/40 bg-success-subtle text-success-foreground",
      icon: CheckCircle,
      label: "Concluído"
    },
    overdue: {
      color: "border-danger/40 bg-danger-subtle text-danger-foreground",
      icon: AlertCircle,
      label: "Em Atraso"
    },
    cancelled: {
      color: "border-border/40 bg-muted/40 text-muted-foreground",
      icon: AlertCircle,
      label: "Cancelado"
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = status === "overdue" || (nextDueDate && new Date(nextDueDate) < new Date());

  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className={cn(
      "p-6 space-y-4",
      isOverdue && "border-danger/40 bg-danger-subtle",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{clientName}</h3>
          </div>
          <p className="text-sm text-muted-foreground">Contrato #{id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig[status].color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[status].label}
          </Badge>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Valor Total</span>
          </div>
          <p className="font-semibold text-lg">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <CreditCard className="h-4 w-4 text-info" />
            <span className="text-sm text-muted-foreground">Parcela</span>
          </div>
          <p className="font-semibold">{formatCurrency(installmentAmount)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <ProgressBar
          value={paidInstallments}
          max={totalInstallments}
          variant={progress === 100 ? "success" : isOverdue ? "danger" : "default"}
          showLabel
          label={`Progresso (${paidInstallments}/${totalInstallments} parcelas)`}
        />
      </div>

      {/* Important Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>Início: {formatDate(startDate)}</span>
        </div>
        {nextDueDate && (
          <div
            className={cn(
              "flex items-center gap-2",
              isOverdue && "text-danger font-medium"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Próximo: {formatDate(nextDueDate)}</span>
          </div>
        )}
      </div>

      {/* Overdue Alert */}
      {overdueAmount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-subtle p-3">
          <AlertCircle className="h-4 w-4 text-danger" />
          <span className="text-sm text-danger-foreground">
            Valor em atraso: {formatCurrency(overdueAmount)}
          </span>
        </div>
      )}

      {/* Installment Details Toggle */}
      <div className="space-y-3">
        <ToggleButton
          pressed={showInstallments}
          onPressedChange={setShowInstallments}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {showInstallments ? "Ocultar" : "Ver"} Detalhes das Parcelas
        </ToggleButton>

        {showInstallments && (
          <div className="rounded-md border border-border/40 bg-muted/30 p-3 space-y-2">
            <div className="text-sm font-medium">Parcelas:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-success">✓ Pagas: {paidInstallments}</span>
              </div>
              <div>
                <span className="text-gray-600">○ Restantes: {totalInstallments - paidInstallments}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">
                  Valor restante: {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {onViewDetails && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        )}

        {onDownloadContract && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownloadContract(id)}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}

        {onEditContract && status === "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditContract(id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
