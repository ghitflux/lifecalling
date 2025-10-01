/* packages/ui/src/SimulationHistoryCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import {
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  User,
  Calendar
} from "lucide-react";

interface SimulationHistoryEntry {
  simulation_id: number;
  action: "approved" | "rejected";
  status: string;
  timestamp: string;
  approved_by?: number;
  approved_by_name?: string;
  rejected_by?: number;
  rejected_by_name?: string;
  reason?: string;
  totals: {
    valorParcelaTotal: number;
    saldoTotal: number;
    liberadoTotal: number;
    seguroObrigatorio?: number;
    totalFinanciado: number;
    valorLiquido: number;
    custoConsultoria: number;
    custoConsultoriaLiquido?: number;
    liberadoCliente: number;
  };
  banks: any[];
  prazo: number;
  percentualConsultoria: number;
}

export interface SimulationHistoryCardProps {
  history: SimulationHistoryEntry[];
  className?: string;
  onSelectSimulation?: (entry: SimulationHistoryEntry) => void;
}

export function SimulationHistoryCard({
  history,
  className,
  onSelectSimulation
}: SimulationHistoryCardProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const getStatusColor = (action: string) => {
    return action === "approved"
      ? "border-success/40 bg-success-subtle"
      : "border-danger/40 bg-danger-subtle";
  };

  const getStatusIcon = (action: string) => {
    return action === "approved"
      ? <CheckCircle className="h-5 w-5 text-success" />
      : <XCircle className="h-5 w-5 text-danger" />;
  };

  const getStatusLabel = (action: string) => {
    return action === "approved" ? "Aprovada" : "Rejeitada";
  };

  if (!history || history.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium text-muted-foreground mb-1">
            Nenhuma simulação anterior
          </h3>
          <p className="text-sm text-muted-foreground">
            Este caso ainda não possui histórico de simulações
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Histórico de Simulações
          </h3>
          <Badge variant="secondary">
            {history.length} simulaç{history.length === 1 ? 'ão' : 'ões'}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.simulation_id}
              className={cn(
                "relative pl-8 pb-4 border-l-2",
                index === history.length - 1 ? "border-l-transparent" : "border-l-border",
                onSelectSimulation && "cursor-pointer hover:bg-muted/30 rounded-lg p-3 -ml-3 transition-colors"
              )}
              onClick={() => onSelectSimulation?.(entry)}
            >
              {/* Timeline dot */}
              <div className="absolute left-[-9px] top-2">
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 border-background",
                  entry.action === "approved" ? "bg-success" : "bg-danger"
                )} />
              </div>

              {/* Content */}
              <div className={cn(
                "rounded-lg border p-4 space-y-3",
                getStatusColor(entry.action)
              )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(entry.action)}
                    <div>
                      <h4 className="font-semibold">
                        Simulação #{entry.simulation_id} - {getStatusLabel(entry.action)}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.timestamp)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={entry.action === "approved" ? "default" : "destructive"}>
                    {entry.action === "approved" ? "✓ Aprovada" : "✗ Rejeitada"}
                  </Badge>
                </div>

                {/* User Info */}
                {(entry.approved_by_name || entry.rejected_by_name) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      Por: {entry.approved_by_name || entry.rejected_by_name}
                    </span>
                  </div>
                )}

                {/* Reason (if rejected) */}
                {entry.action === "rejected" && entry.reason && (
                  <div className="bg-danger-subtle/30 rounded-md p-3 text-sm">
                    <span className="font-medium">Motivo:</span> {entry.reason}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Valor Liberado</span>
                    <p className="font-semibold text-success">
                      {formatCurrency(entry.totals.liberadoTotal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Prazo</span>
                    <p className="font-semibold">
                      {entry.prazo} meses
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Liberado Cliente</span>
                    <p className="font-semibold text-primary">
                      {formatCurrency(entry.totals.liberadoCliente)}
                    </p>
                  </div>
                </div>

                {/* Banks Summary */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {entry.banks.map((bank: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {bank.bank?.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
