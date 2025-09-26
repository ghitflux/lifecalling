/* packages/ui/src/ClosingCard.tsx */
import React, { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { StatusBadge, type Status } from "./StatusBadge";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { User, Calendar, CreditCard, Building2, Hash, DollarSign } from "lucide-react";

interface ClosingCardProps {
  case: {
    id: number;
    status: Status;
    client: {
      name: string;
      cpf: string;
      matricula: string;
      orgao?: string;
    };
    contract?: {
      total_amount: number;
      installments: number;
    };
    simulation?: {
      total_amount: number;
      installments: number;
      monthly_payment: number;
    };
    banco?: string;
    created_at: string;
    last_update_at?: string;
  };
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onViewDetails: (id: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function ClosingCard({
  case: caseData,
  onApprove,
  onReject,
  onViewDetails,
  isLoading = false,
  className
}: ClosingCardProps) {
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleApprove = () => {
    if (showConfirm === 'approve') {
      onApprove(caseData.id);
      setShowConfirm(null);
    } else {
      setShowConfirm('approve');
    }
  };

  const handleReject = () => {
    if (showConfirm === 'reject') {
      onReject(caseData.id);
      setShowConfirm(null);
    } else {
      setShowConfirm('reject');
    }
  };

  const totalAmount = caseData.contract?.total_amount || caseData.simulation?.total_amount;
  const installments = caseData.contract?.installments || caseData.simulation?.installments;
  const monthlyPayment = caseData.simulation?.monthly_payment;

  return (
    <Card className={cn("p-6 space-y-4 hover:shadow-md transition-shadow", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Caso #{caseData.id}</h3>
            <StatusBadge status={caseData.status} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            Criado em {formatDate(caseData.created_at)}
          </p>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{caseData.client.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span>CPF: {caseData.client.cpf}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            <span>Mat: {caseData.client.matricula}</span>
          </div>
        </div>

        {(caseData.client.orgao || caseData.banco) && (
          <div className="flex items-center gap-4 text-sm">
            {caseData.client.orgao && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span>{caseData.client.orgao}</span>
              </div>
            )}
            {caseData.banco && (
              <Badge variant="outline" className="text-xs">
                {caseData.banco}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Financial Info */}
      {totalAmount && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>Informações Financeiras</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            {installments && (
              <div>
                <span className="text-muted-foreground">Parcelas: </span>
                <span className="font-medium">{installments}x</span>
              </div>
            )}
          </div>
          {monthlyPayment && (
            <div className="text-sm">
              <span className="text-muted-foreground">Valor mensal: </span>
              <span className="font-medium text-green-600">
                {formatCurrency(monthlyPayment)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails(caseData.id)}
          disabled={isLoading}
        >
          Ver Detalhes
        </Button>

        {showConfirm === 'approve' ? (
          <div className="flex gap-1 flex-1">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isLoading}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={isLoading}
          >
            ✓ Aprovar
          </Button>
        )}

        {showConfirm === 'reject' ? (
          <div className="flex gap-1 flex-1">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={isLoading}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
          >
            ✗ Reprovar
          </Button>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </Card>
  );
}