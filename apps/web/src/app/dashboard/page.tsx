/* apps/web/src/app/dashboard/page.tsx */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard, AreaChart, PieChart, BarChart, LineChart, EsteiraCard, FilterProvider, Grid } from "@lifecalling/ui";
import { useDashboardStats, useDashboardStatusBreakdown, useDashboardPerformance, useDashboardChartData, useDashboardUserPerformance, useDashboardMonthlyTrends } from "@/lib/hooks";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle, Clock, Users, TrendingUp, DollarSign } from "lucide-react";

function DashboardContent() {
  useLiveCaseEvents();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Dados reais do dashboard
  const { data: stats } = useDashboardStats();
  const { data: statusBreakdown } = useDashboardStatusBreakdown();
  const { data: performance } = useDashboardPerformance();
  const { data: chartData } = useDashboardChartData("6m");

  const { data: recentCases = [] } = useQuery({
    queryKey: ["dashboard", "recent-cases"],
    queryFn: async () => {
      const response = await api.get("/cases?page_size=6&order=id_desc");
      return response.data?.items || [];
    },
    refetchInterval: 30000
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema LifeCalling</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-background border border-input rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <Grid cols={4} gap="md">
          <KPICard
            title="Atendimentos Ativos"
            value={stats.activeCases.toString()}
            trend={12.5}
            icon={Users}
            color="primary"
            subtitle={`${stats.totalCases} total`}
          />
          <KPICard
            title="Taxa de Aprovação"
            value={`${stats.approvalRate}%`}
            trend={3.2}
            icon={TrendingUp}
            color="success"
          />
          <KPICard
            title="Volume Financeiro"
            value={`R$ ${(stats.totalVolume / 1000000).toFixed(1)}M`}
            trend={stats.totalVolume > stats.monthlyTarget ? 8.4 : -2.1}
            icon={DollarSign}
            color={stats.totalVolume > stats.monthlyTarget ? "success" : "warning"}
            subtitle={`Meta: R$ ${(stats.monthlyTarget / 1000000).toFixed(1)}M`}
          />
          <KPICard
            title="Simulações Pendentes"
            value={stats.pendingSimulations.toString()}
            icon={Clock}
            color="info"
            subtitle="Aguardando análise"
          />
        </Grid>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {chartData && (
            <AreaChart
              title="Evolução de Atendimentos"
              subtitle="Últimos 6 meses"
              data={chartData.data}
              dataKey="value"
              xAxisKey="month"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Status dos Atendimentos
            </h3>
            <div className="space-y-2 text-sm">
              {statusBreakdown && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novos</span>
                    <span className="font-medium">{statusBreakdown.novo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Em Atendimento</span>
                    <span className="font-medium">{statusBreakdown.em_atendimento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculista</span>
                    <span className="font-medium">{statusBreakdown.calculista_pendente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechamento</span>
                    <span className="font-medium">{statusBreakdown.calculo_aprovado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Financeiro</span>
                    <span className="font-medium">{statusBreakdown.fechamento_aprovado}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Performance Hoje
            </h3>
            <div className="space-y-2 text-sm">
              {performance && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atendimentos Aprovados</span>
                    <span className="font-medium text-green-600">+{performance.casosAprovados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Simulações Feitas</span>
                    <span className="font-medium">+{performance.simulacoesFeitas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contratos Fechados</span>
                    <span className="font-medium text-blue-600">+{performance.contratosFechados}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Atendimentos Recentes</h2>
        {recentCases.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recentCases.slice(0, 6).map((caso: any) => (
              <EsteiraCard
                key={caso.id}
                caso={caso}
                onView={(id) => window.location.href = `/casos/${id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum atendimento recente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
}
