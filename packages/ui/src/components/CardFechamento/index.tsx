"use client";
import React, { useState } from "react";
import { Card } from "../../Card";
import { Button } from "../../Button";
import { StatusBadge, type Status } from "../../StatusBadge";
import { Badge } from "../../Badge";
import { cn } from "../../lib/utils";
import { User, Calendar, CreditCard, Building2, Hash, DollarSign, Phone } from "lucide-react";

interface CardFechamentoProps {
  case: {
    id: number;
    status: Status;
    client?: {
      name?: string;
      cpf?: string;
      matricula?: string;
      orgao?: string;
      telefone?: string;
    };
    contract?: {
      total_amount?: number;
      installments?: number;
    };
    simulation?: {
      total_amount?: number;
      installments?: number;
      monthly_payment?: number;
    };
    banco?: string;
    created_at?: string;
    last_update_at?: string;
  };
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onViewDetails: (id: number) => void;
  isLoading?: boolean;
  className?: string;
  hideActions?: boolean;
}

export function CardFechamento({
  case: caseData,
  onApprove,
  onReject,
  onViewDetails,
  isLoading = false,
  className,
  hideActions = false
}: CardFechamentoProps) {
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
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
    <Card 
      className={cn("p-6 space-y-4 hover:shadow-md transition-shadow", className)}
      role="article"
      aria-labelledby={`case-title-${caseData.id}`}
      aria-describedby={`case-description-${caseData.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 
              id={`case-title-${caseData.id}`}
              className="font-semibold text-lg"
            >
              Caso #{caseData.id}
            </h3>
            <StatusBadge status={caseData.status} size="sm" />
          </div>
          <p 
            id={`case-description-${caseData.id}`}
            className="text-sm text-muted-foreground"
          >
            Criado em {formatDate(caseData.created_at)}
          </p>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-3" role="group" aria-label="Informações do cliente">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{caseData.client?.name || 'Nome não informado'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span>CPF: {caseData.client?.cpf || 'Não informado'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span>Mat: {caseData.client?.matricula || 'Não informado'}</span>
          </div>
        </div>

        {caseData.client?.telefone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium text-blue-600">{caseData.client.telefone}</span>
          </div>
        )}

        {(caseData.client?.orgao || caseData.banco) && (
          <div className="flex items-center gap-4 text-sm">
            {caseData.client?.orgao && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
        <div 
          className="bg-muted/30 rounded-lg p-3 space-y-2"
          role="group" 
          aria-label="Informações financeiras"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-green-600" aria-hidden="true" />
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
      <div className="flex gap-2 pt-2" role="group" aria-label="Ações do caso">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(caseData.id)}
          disabled={isLoading}
          aria-label={`Ver detalhes do caso ${caseData.id}`}
        >
          Ver Detalhes
        </Button>
        
        {!hideActions && (
          <>
            <Button
              variant={showConfirm === 'approve' ? "default" : "outline"}
              size="sm"
              onClick={handleApprove}
              disabled={isLoading}
              className={showConfirm === 'approve' ? "bg-green-600 hover:bg-green-700" : ""}
              aria-label={
                showConfirm === 'approve' 
                  ? `Confirmar aprovação do caso ${caseData.id}` 
                  : `Aprovar caso ${caseData.id}`
              }
            >
              {showConfirm === 'approve' ? 'Confirmar Aprovação' : 'Aprovar'}
            </Button>
            
            <Button
              variant={showConfirm === 'reject' ? "destructive" : "outline"}
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
              aria-label={
                showConfirm === 'reject' 
                  ? `Confirmar rejeição do caso ${caseData.id}` 
                  : `Rejeitar caso ${caseData.id}`
              }
            >
              {showConfirm === 'reject' ? 'Confirmar Rejeição' : 'Rejeitar'}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}