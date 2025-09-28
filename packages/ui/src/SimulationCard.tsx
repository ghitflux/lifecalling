/* packages/ui/src/SimulationCard.tsx */
import React from "react";
import { cn } from "./lib/utils";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "./Button";

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

interface SimulationCardProps {
  result: SimulationResult;
  isActive?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

export function SimulationCard({
  result,
  isActive,
  onApprove,
  onReject,
  className
}: SimulationCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6 transition-all",
      isActive && "ring-2 ring-primary shadow-glow border-primary/50",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Simulação de Empréstimo</h3>
        </div>
        {result.banco && (
          <div className="bg-primary/10 px-3 py-1 rounded-md">
            <span className="text-sm font-medium text-primary">{result.banco}</span>
          </div>
        )}
      </div>

      {/* Seção Principal - Baseada na imagem */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">VALOR PARCELA</p>
          <p className="text-xl font-bold">
            R$ {result.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">SALDO DEVEDOR</p>
          <p className="text-xl font-bold">
            R$ {(result.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">VALOR LIBERADO</p>
          <p className="text-xl font-bold text-green-600">
            R$ {result.valorLiberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">VALOR TOTAL FINANCIADO</p>
          <p className="text-lg font-semibold">
            R$ {(result.valorTotalFinanciado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Seção Secundária */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">SEGURO OBRIGATÓRIO BANCO</p>
          <p className="text-lg font-semibold">
            R$ {(result.seguroObrigatorio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">VALOR LÍQUIDO</p>
          <p className="text-lg font-semibold">
            R$ {(result.valorLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">CUSTO CONSULTORIA</p>
          <p className="text-lg font-semibold">
            R$ {(result.custoConsultoria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">LIBERADO CLIENTE</p>
          <p className="text-xl font-bold text-blue-600">
            R$ {(result.liberadoCliente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Detalhes Técnicos */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">COEFICIENTE</p>
          <p className="font-mono font-semibold">
            {result.coeficiente ? result.coeficiente.toFixed(7) : 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">PRAZO</p>
          <p className="font-semibold">
            {result.prazo} MESES
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">% PERCENTUAL COBRADO C.O</p>
          <p className="font-semibold">
            {result.percentualConsultoria ? (result.percentualConsultoria * 100).toFixed(0) : '12'}%
          </p>
        </div>
      </div>

      {(onApprove || onReject) && (
        <div className="flex gap-2">
          {onApprove && (
            <Button
              className="flex-1"
              onClick={onApprove}
            >
              Aprovar
            </Button>
          )}
          {onReject && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onReject}
            >
              Reprovar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
