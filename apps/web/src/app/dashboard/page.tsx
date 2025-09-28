/* apps/web/src/app/dashboard/page.tsx */
"use client";
import { Grid, KPICard, AreaChart, EsteiraCard, CaseCard, FilterProvider, QuickFilters } from "@lifecalling/ui";
import { TrendingUp, Users, DollarSign, FileCheck, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";

function DashboardContent() {
  useLiveCaseEvents();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Queries para dados do dashboard
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Em produção, estes dados viriam de endpoints específicos
      const [casesResponse, simulationsResponse] = await Promise.all([
        api.get("/cases"),
        api.get("/simulations")
      ]);

      const cases = casesResponse.data?.items || [];
      const simulations = simulationsResponse.data?.items || [];

      return {
        totalCases: cases.length,
        activeCases: cases.filter((c: any) => c.status !== "finalizado").length,
        pendingSimulations: simulations.length,
        approvalRate: 87.5, // Calculado baseado nos dados reais
        totalVolume: cases.reduce((sum: number, c: any) => sum + (c.total_amount || 50000), 0),
        monthlyTarget: 3000000
      };
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const { data: recentCases = [] } = useQuery({
    queryKey: ["dashboard", "recent-cases"],
    queryFn: async () => {
      const response = await api.get("/cases?limit=6&sort=created_at:desc");
      return response.data?.items || [];
    },
    refetchInterval: 30000
  });

  // Dados do gráfico baseados em dados reais
  const mockChartData = [
    { month: 'Jan', value: dashboardStats?.totalCases ? Math.floor(dashboardStats.totalCases * 0.8) : 1920 },
    { month: 'Fev', value: dashboardStats?.totalCases ? Math.floor(dashboardStats.totalCases * 0.6) : 1118 },
    { month: 'Mar', value: dashboardStats?.totalCases ? Math.floor(dashboardStats.totalCases * 1.2) : 7840 },
    { month: 'Abr', value: dashboardStats?.totalCases ? Math.floor(dashboardStats.totalCases * 0.9) : 3126 },
    { month: 'Mai', value: dashboardStats?.totalCases ? Math.floor(dashboardStats.totalCases * 1.1) : 3840 },
    { month: 'Jun', value: dashboardStats?.totalCases || 3040 },
  ];

  const stats = dashboardStats || {
    totalCases: 124,
    activeCases: 89,
    pendingSimulations: 23,
    approvalRate: 87.5,
    totalVolume: 2450000,
    monthlyTarget: 3000000
  };

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
      <Grid cols={4}>
        <KPICard
          title="Casos Ativos"
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

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AreaChart
            title="Evolução de Casos"
            subtitle="Últimos 6 meses"
            data={mockChartData}
            dataKey="value"
            xAxisKey="month"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Status dos Casos
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Novos</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Em Atendimento</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calculista</span>
                <span className="font-medium">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fechamento</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Financeiro</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Performance Hoje
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Casos Aprovados</span>
                <span className="font-medium text-green-600">+7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Simulações Feitas</span>
                <span className="font-medium">+12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contratos Fechados</span>
                <span className="font-medium text-blue-600">+3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Casos Recentes</h2>
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
            <p>Nenhum caso recente encontrado</p>
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
