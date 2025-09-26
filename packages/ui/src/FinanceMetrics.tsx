/* packages/ui/src/FinanceMetrics.tsx */
import React from "react";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { cn } from "./lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  AlertTriangle
} from "lucide-react";

export interface MetricItem {
  label: string;
  value: string | number;
  change?: number;
  target?: number;
  format?: "currency" | "percentage" | "number";
  variant?: "default" | "success" | "warning" | "danger";
}

export interface FinanceMetricsProps {
  totalVolume: number;
  monthlyTarget?: number;
  approvalRate: number;
  pendingCount: number;
  overdueCount: number;
  averageTicket: number;
  className?: string;
}

export function FinanceMetrics({
  totalVolume,
  monthlyTarget,
  approvalRate,
  pendingCount,
  overdueCount,
  averageTicket,
  className
}: FinanceMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const targetProgress = monthlyTarget ? (totalVolume / monthlyTarget) * 100 : 0;

  const metrics: MetricItem[] = [
    {
      label: "Volume Total",
      value: formatCurrency(totalVolume),
      variant: totalVolume > (monthlyTarget || 0) * 0.8 ? "success" : "warning"
    },
    {
      label: "Taxa de Aprovação",
      value: `${approvalRate.toFixed(1)}%`,
      variant: approvalRate >= 85 ? "success" : approvalRate >= 70 ? "warning" : "danger"
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(averageTicket),
      variant: "default"
    },
    {
      label: "Pendentes",
      value: pendingCount,
      variant: pendingCount > 10 ? "warning" : "default"
    }
  ];

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case "success":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "danger":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-blue-600" />;
    }
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {metric.label}
                </span>
                {getVariantIcon(metric.variant || "default")}
              </div>
              <div className={cn(
                "text-2xl font-bold",
                getVariantColor(metric.variant || "default")
              )}>
                {metric.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Target Progress */}
      {monthlyTarget && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Meta Mensal</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalVolume)} / {formatCurrency(monthlyTarget)}
              </span>
            </div>

            <ProgressBar
              value={totalVolume}
              max={monthlyTarget}
              variant={targetProgress >= 100 ? "success" : targetProgress >= 80 ? "warning" : "default"}
              showLabel
              label="Progresso da Meta"
            />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">Restante</div>
                <div className="text-muted-foreground">
                  {formatCurrency(Math.max(0, monthlyTarget - totalVolume))}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Progresso</div>
                <div className="text-muted-foreground">
                  {targetProgress.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Status</div>
                <div className={cn(
                  "font-medium",
                  targetProgress >= 100 ? "text-green-600" :
                  targetProgress >= 80 ? "text-yellow-600" : "text-red-600"
                )}>
                  {targetProgress >= 100 ? "✓ Atingida" :
                   targetProgress >= 80 ? "⚠ Próxima" : "✗ Distante"}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts */}
      {(overdueCount > 0 || pendingCount > 15) && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-orange-900">Atenção Necessária</h4>
              <div className="text-sm text-orange-700 space-y-1">
                {overdueCount > 0 && (
                  <p>• {overdueCount} contratos com pagamento em atraso</p>
                )}
                {pendingCount > 15 && (
                  <p>• {pendingCount} casos pendentes de aprovação (acima do normal)</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}