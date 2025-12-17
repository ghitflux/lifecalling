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
  totalTax?: number; // 14% do total de consultorias
  totalExpenses?: number; // Total de despesas
  totalManualIncome?: number; // Receitas manuais
  totalRevenue?: number; // Total de receitas
  netProfit?: number; // Receitas - Despesas - Impostos
  className?: string;
}

export function FinanceMetrics({
  totalVolume,
  monthlyTarget,
  approvalRate,
  pendingCount,
  overdueCount,
  averageTicket,
  totalTax,
  totalExpenses,
  totalManualIncome,
  totalRevenue,
  netProfit,
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

  const baseMetrics: MetricItem[] = [
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

  const additionalMetrics: MetricItem[] = [];

  if (totalManualIncome !== undefined) {
    additionalMetrics.push({
      label: "Receitas Manuais",
      value: formatCurrency(totalManualIncome),
      variant: "success"
    });
  }

  if (totalRevenue !== undefined) {
    additionalMetrics.push({
      label: "Receitas Totais",
      value: formatCurrency(totalRevenue),
      variant: "success"
    });
  }

  if (totalExpenses !== undefined) {
    additionalMetrics.push({
      label: "Despesas",
      value: formatCurrency(totalExpenses),
      variant: "warning"
    });
  }

  if (totalTax !== undefined) {
    additionalMetrics.push({
      label: "Impostos (14%)",
      value: formatCurrency(totalTax),
      variant: "danger"
    });
  }

  if (netProfit !== undefined) {
    additionalMetrics.push({
      label: "Lucro Líquido",
      value: formatCurrency(netProfit),
      variant: netProfit > 0 ? "success" : "danger"
    });
  }

  const metrics = [...baseMetrics, ...additionalMetrics];

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case "success":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "danger":
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <DollarSign className="h-4 w-4 text-info" />;
    }
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-danger";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
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
                <div
                  className={cn(
                    "font-medium",
                    targetProgress >= 100
                      ? "text-success"
                      : targetProgress >= 80
                        ? "text-warning"
                        : "text-danger"
                  )}
                >
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
        <Card className="border-warning/40 bg-warning-subtle p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning">Atenção Necessária</h4>
              <div className="space-y-1 text-sm text-warning-foreground">
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
