/* packages/ui/src/ContractSummary.tsx */
import React from "react";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Calendar
} from "lucide-react";

export interface ContractStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  totalValue: number;
  receivedValue: number;
  overdueValue: number;
  averageTicket: number;
}

export interface ContractSummaryProps {
  stats: ContractStats;
  monthlyTarget?: number;
  className?: string;
}

export function ContractSummary({
  stats,
  monthlyTarget,
  className
}: ContractSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const receivedPercentage = stats.totalValue > 0 ? (stats.receivedValue / stats.totalValue) * 100 : 0;
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const overdueRate = stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0;

  const summaryCards = [
    {
      title: "Contratos Ativos",
      value: stats.active,
      icon: Clock,
      color: "text-info",
      bgColor: "bg-info-subtle border border-info/40"
    },
    {
      title: "Contratos Concluídos",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success-subtle border border-success/40"
    },
    {
      title: "Contratos em Atraso",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-danger",
      bgColor: "bg-danger-subtle border border-danger/40"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.averageTicket),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={cn("text-2xl font-bold", card.color)}>
                    {card.value}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <Icon className={cn("h-6 w-6", card.color)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Progress */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Receita Recebida</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {receivedPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Recebido</span>
                <span className="font-medium text-success">
                  {formatCurrency(stats.receivedValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">
                  {formatCurrency(stats.totalValue)}
                </span>
              </div>
            </div>

            <ProgressBar
              value={stats.receivedValue}
              max={stats.totalValue}
              variant="success"
              showLabel={false}
            />

            <div className="text-sm text-muted-foreground">
              Restante: {formatCurrency(stats.totalValue - stats.receivedValue)}
            </div>
          </div>
        </Card>

        {/* Contract Completion */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-info" />
                <h3 className="font-semibold">Taxa de Conclusão</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {completionRate.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Concluídos</span>
                <span className="font-medium text-success">
                  {stats.completed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">
                  {stats.total}
                </span>
              </div>
            </div>

            <ProgressBar
              value={stats.completed}
              max={stats.total}
              variant={completionRate >= 80 ? "success" : completionRate >= 60 ? "warning" : "danger"}
              showLabel={false}
            />

            <div className="text-sm text-muted-foreground">
              Em andamento: {stats.active}
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts and Status */}
      <div className="space-y-4">
        {/* Overdue Alert */}
        {stats.overdue > 0 && (
          <Card className="border-danger/40 bg-danger-subtle p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
              <div className="space-y-1">
                <h4 className="font-medium text-danger">Atenção: Contratos em Atraso</h4>
                <div className="space-y-1 text-sm text-danger-foreground">
                  <p>• {stats.overdue} contratos com parcelas em atraso</p>
                  <p>• Valor total em atraso: {formatCurrency(stats.overdueValue)}</p>
                  <p>• Taxa de inadimplência: {overdueRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Monthly Target */}
        {monthlyTarget && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Meta Mensal de Contratos</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {stats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Atual</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {monthlyTarget}
                  </div>
                  <div className="text-sm text-muted-foreground">Meta</div>
                </div>
                <div className="space-y-1">
                  <div className={cn(
                    "text-2xl font-bold",
                    stats.total >= monthlyTarget ? "text-success" : "text-danger"
                  )}>
                    {stats.total >= monthlyTarget ? "✓" : Math.max(0, monthlyTarget - stats.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.total >= monthlyTarget ? "Atingida" : "Restante"}
                  </div>
                </div>
              </div>

              <ProgressBar
                value={stats.total}
                max={monthlyTarget}
                variant={stats.total >= monthlyTarget ? "success" : "warning"}
                showLabel
                label="Progresso da Meta"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
