/* packages/ui/src/SimulationCard.tsx */
import React from "react";
import { cn } from "./lib/utils";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "./Button";

interface SimulationResult {
  valorLiberado: number;
  valorParcela: number;
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
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Simulação</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Valor Liberado</p>
          <p className="text-xl font-bold text-success">
            R$ {result.valorLiberado.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Parcela</p>
          <p className="text-xl font-bold">
            R$ {result.valorParcela.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Taxa</p>
          <p className="text-lg font-semibold">
            {result.taxaJuros}% a.m.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Prazo</p>
          <p className="text-lg font-semibold">
            {result.prazo} meses
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
