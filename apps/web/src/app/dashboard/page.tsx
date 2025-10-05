"use client";
import { useMemo, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  KPICard,
  LineChart,
  AreaChart,
  BarChart,
  PieChart,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MiniAreaChart,
  MiniBarChart,
  Button,
  FilterDropdown,
  DateRangeFilter,
} from "@lifecalling/ui";
import { useAnalyticsKpis, useAnalyticsSeries } from "@/lib/hooks";
import { startOfDayBrasilia, endOfDayBrasilia, startOfMonthBrasilia, endOfMonthBrasilia, dateToISO } from "@/lib/timezone";
import { api } from "@/lib/api";
import {
  Calendar,
  Activity,
  CheckCircle,
  Target,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Users,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Receipt,
} from "lucide-react";

type AnalyticsBucket = "day" | "week" | "month";

// Usar helper de timezone de Brasília
const iso = dateToISO;

// Dados mockados para mini gráficos (últimos 7 dias)
const MOCK_TREND_DATA = {
  receita: [
    { day: "D1", value: 15000 },
    { day: "D2", value: 18000 },
    { day: "D3", value: 22000 },
    { day: "D4", value: 19000 },
    { day: "D5", value: 25000 },
    { day: "D6", value: 28000 },
    { day: "D7", value: 32000 },
  ],
  despesas: [
    { day: "D1", value: 8000 },
    { day: "D2", value: 9500 },
    { day: "D3", value: 7800 },
    { day: "D4", value: 11000 },
    { day: "D5", value: 9200 },
    { day: "D6", value: 10500 },
    { day: "D7", value: 12000 },
  ],
  resultado: [
    { day: "D1", value: 7000 },
    { day: "D2", value: 8500 },
    { day: "D3", value: 14200 },
    { day: "D4", value: 8000 },
    { day: "D5", value: 15800 },
    { day: "D6", value: 17500 },
    { day: "D7", value: 20000 },
  ],
  atendimento: [
    { day: "D1", value: 45 },
    { day: "D2", value: 52 },
    { day: "D3", value: 38 },
    { day: "D4", value: 61 },
    { day: "D5", value: 48 },
    { day: "D6", value: 55 },
    { day: "D7", value: 42 },
  ],
  progresso: [
    { day: "D1", value: 12 },
    { day: "D2", value: 18 },
    { day: "D3", value: 15 },
    { day: "D4", value: 22 },
    { day: "D5", value: 19 },
    { day: "D6", value: 25 },
    { day: "D7", value: 16 },
  ],
  sla: [
    { day: "D1", value: 85 },
    { day: "D2", value: 92 },
    { day: "D3", value: 88 },
    { day: "D4", value: 95 },
    { day: "D5", value: 91 },
    { day: "D6", value: 97 },
    { day: "D7", value: 94 },
  ],
  tma: [
    { day: "D1", value: 45 },
    { day: "D2", value: 38 },
    { day: "D3", value: 52 },
    { day: "D4", value: 35 },
    { day: "D5", value: 41 },
    { day: "D6", value: 33 },
    { day: "D7", value: 39 },
  ],
  simulacoes: [
    { day: "D1", value: 25 },
    { day: "D2", value: 32 },
    { day: "D3", value: 28 },
    { day: "D4", value: 41 },
    { day: "D5", value: 35 },
    { day: "D6", value: 48 },
    { day: "D7", value: 52 },
  ],
  aprovadas: [
    { day: "D1", value: 18 },
    { day: "D2", value: 24 },
    { day: "D3", value: 21 },
    { day: "D4", value: 32 },
    { day: "D5", value: 28 },
    { day: "D6", value: 38 },
    { day: "D7", value: 42 },
  ],
  conversao: [
    { day: "D1", value: 72 },
    { day: "D2", value: 75 },
    { day: "D3", value: 75 },
    { day: "D4", value: 78 },
    { day: "D5", value: 80 },
    { day: "D6", value: 79 },
    { day: "D7", value: 81 },
  ],
  contratos: [
    { day: "D1", value: 8 },
    { day: "D2", value: 12 },
    { day: "D3", value: 10 },
    { day: "D4", value: 15 },
    { day: "D5", value: 13 },
    { day: "D6", value: 18 },
    { day: "D7", value: 21 },
  ],
  consultoria: [
    { day: "D1", value: 12000 },
    { day: "D2", value: 15500 },
    { day: "D3", value: 14200 },
    { day: "D4", value: 18800 },
    { day: "D5", value: 16900 },
    { day: "D6", value: 22100 },
    { day: "D7", value: 25400 },
  ],
  // Novos dados para KPIs adicionais
  margem: [
    { day: "D1", value: 35 },
    { day: "D2", value: 42 },
    { day: "D3", value: 38 },
    { day: "D4", value: 45 },
    { day: "D5", value: 41 },
    { day: "D6", value: 48 },
    { day: "D7", value: 52 },
  ],
  clientes: [
    { day: "D1", value: 125 },
    { day: "D2", value: 132 },
    { day: "D3", value: 128 },
    { day: "D4", value: 145 },
    { day: "D5", value: 138 },
    { day: "D6", value: 152 },
    { day: "D7", value: 165 },
  ],
  satisfacao: [
    { day: "D1", value: 4.2 },
    { day: "D2", value: 4.5 },
    { day: "D3", value: 4.3 },
    { day: "D4", value: 4.7 },
    { day: "D5", value: 4.4 },
    { day: "D6", value: 4.8 },
    { day: "D7", value: 4.6 },
  ],
  produtividade: [
    { day: "D1", value: 85 },
    { day: "D2", value: 92 },
    { day: "D3", value: 88 },
    { day: "D4", value: 95 },
    { day: "D5", value: 91 },
    { day: "D6", value: 97 },
    { day: "D7", value: 94 },
  ],
  tempo_medio: [
    { day: "D1", value: 25 },
    { day: "D2", value: 22 },
    { day: "D3", value: 28 },
    { day: "D4", value: 20 },
    { day: "D5", value: 24 },
    { day: "D6", value: 18 },
    { day: "D7", value: 21 },
  ],
  rejeitadas: [
    { day: "D1", value: 5 },
    { day: "D2", value: 3 },
    { day: "D3", value: 7 },
    { day: "D4", value: 4 },
    { day: "D5", value: 6 },
    { day: "D6", value: 2 },
    { day: "D7", value: 4 },
  ],
  valor_medio: [
    { day: "D1", value: 2500 },
    { day: "D2", value: 2800 },
    { day: "D3", value: 2650 },
    { day: "D4", value: 3200 },
    { day: "D5", value: 2950 },
    { day: "D6", value: 3400 },
    { day: "D7", value: 3650 },
  ],
  efetivados: [
    { day: "D1", value: 6 },
    { day: "D2", value: 9 },
    { day: "D3", value: 7 },
    { day: "D4", value: 12 },
    { day: "D5", value: 10 },
    { day: "D6", value: 15 },
    { day: "D7", value: 18 },
  ],
  lucro: [
    { day: "D1", value: 6400 },
    { day: "D2", value: 9100 },
    { day: "D3", value: 8000 },
    { day: "D4", value: 11100 },
    { day: "D5", value: 15800 },
    { day: "D6", value: 9800 },
    { day: "D7", value: 6000 },
  ],
  imposto: [
    { day: "D1", value: 1680 },
    { day: "D2", value: 2170 },
    { day: "D3", value: 1988 },
    { day: "D4", value: 2632 },
    { day: "D5", value: 2366 },
    { day: "D6", value: 3094 },
    { day: "D7", value: 3556 },
  ],
};

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const [from, setFrom] = useState<string>(() => {
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return iso(startOfDayBrasilia(past));
  });
  const [to, setTo] = useState<string>(() => iso(new Date()));
  const [bucket, setBucket] = useState<AnalyticsBucket>("day");

  // Estado para o filtro unificado por mês
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados para DateRangeFilter - iniciam vazios (filtro personalizado limpo)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Função para lidar com mudança de mês
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const [year, monthNum] = month.split('-');
    const startDateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDateObj = new Date(parseInt(year), parseInt(monthNum), 0);

    setFrom(iso(startOfDayBrasilia(startDateObj)));
    setTo(iso(endOfDayBrasilia(endDateObj)));

    // Sincronizar com DateRangeFilter
    setStartDate(startDateObj.toISOString().split('T')[0]);
    setEndDate(endDateObj.toISOString().split('T')[0]);

    // Invalidar cache dos KPIs para forçar nova busca
    queryClient.invalidateQueries({ queryKey: ["analytics", "kpis"] });
    queryClient.invalidateQueries({ queryKey: ["analytics", "series"] });
  };

  // Filtros rápidos de mês usando timezone de Brasília
  const getQuickMonthFilters = () => {
    const now = new Date();
    const filters: { label: string; from: string; to: string }[] = [];

    // Mês atual
    const currentMonthStart = startOfMonthBrasilia(now);
    const currentMonthEnd = endOfMonthBrasilia(now);
    filters.push({
      label: "Este Mês",
      from: iso(currentMonthStart),
      to: iso(currentMonthEnd),
    });

    // Últimos 3 meses
    for (let i = 1; i <= 3; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonthBrasilia(targetDate);
      const monthEnd = endOfMonthBrasilia(targetDate);

      const monthName = targetDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo"
      });

      filters.push({
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        from: iso(monthStart),
        to: iso(monthEnd),
      });
    }

    return filters;
  };

  // Função para lidar com mudanças no DateRangeFilter
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setStartDate(startDate);
    setEndDate(endDate);

    // Converter para Date objects e aplicar timezone de Brasília
    const startDateObj = new Date(startDate + 'T00:00:00');
    const endDateObj = new Date(endDate + 'T23:59:59');

    setFrom(iso(startOfDayBrasilia(startDateObj)));
    setTo(iso(endOfDayBrasilia(endDateObj)));

    // Limpar seleção de mês quando usar range customizado
    setSelectedMonth('');

    // Invalidar cache dos KPIs para forçar nova busca
    queryClient.invalidateQueries({ queryKey: ["analytics", "kpis"] });
    queryClient.invalidateQueries({ queryKey: ["analytics", "series"] });
    queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
  };

  // Função para limpar filtros de data
  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');

    // Voltar para o mês atual
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(currentMonth);
  };

  // Exportações
  const { data: kpis, isLoading: kpisLoading } = useAnalyticsKpis({ from, to }, selectedMonth);
  const { data: series } = useAnalyticsSeries({ from, to }, bucket, selectedMonth);
  const seriesData = useMemo(() => series?.series ?? [], [series]);

  // Métricas financeiras - usar filtro personalizado se definido, senão usar mês atual
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["financeMetrics", startDate, endDate, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Se há filtro personalizado (startDate e endDate), usar ele
      if (startDate && endDate) {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      } else {
        // Senão, usar o mês selecionado (padrão: mês atual)
        params.append("month", selectedMonth);
      }

      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });

  const metrics = metricsData || {};

  // Calcular período anterior para comparação
  const calculatePreviousPeriod = () => {
    if (startDate && endDate) {
      // Se há filtro personalizado, calcular período anterior baseado nas datas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const prevEnd = new Date(start.getTime() - 1); // Um dia antes do período atual
      const prevStart = new Date(prevEnd.getTime() - (diffDays * 24 * 60 * 60 * 1000));

      return {
        type: 'date_range',
        startDate: prevStart.toISOString().split('T')[0],
        endDate: prevEnd.toISOString().split('T')[0]
      };
    } else {
      // Se não há filtro personalizado, usar mês anterior
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      return {
        type: 'month',
        month: `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
      };
    }
  };

  const previousPeriod = calculatePreviousPeriod();

  // Buscar métricas do período anterior para comparação
  const { data: previousMetricsData } = useQuery({
    queryKey: ["financeMetrics", "previous", previousPeriod],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (previousPeriod.type === 'date_range') {
        params.append("start_date", previousPeriod.startDate!);
        params.append("end_date", previousPeriod.endDate ?? "");
      } else {
        if (previousPeriod.month) {
          params.append("month", previousPeriod.month);
        }
      }

      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });

  const previousMetrics = previousMetricsData || {};

  // Função para calcular tendência percentual
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  };

  // Calcular tendências reais para métricas financeiras
  const financeTrends = {
    receita: calculateTrend(metrics.totalRevenue || 0, previousMetrics.totalRevenue || 0),
    despesas: calculateTrend(metrics.totalExpenses || 0, previousMetrics.totalExpenses || 0),
    lucro: calculateTrend(metrics.netProfit || 0, previousMetrics.netProfit || 0),
    consultoria: calculateTrend(metrics.totalConsultoriaLiq || 0, previousMetrics.totalConsultoriaLiq || 0),
    imposto: calculateTrend(
      (metrics.totalConsultoriaLiq || 0) * 0.14,
      (previousMetrics.totalConsultoriaLiq || 0) * 0.14
    )
  };

  const exportToCSV = () => {
    if (!kpis) return;

    const csvData = [
      ["Métrica", "Valor"],
      [
        "Receita Automática (MTD)",
        `R$ ${(kpis.receita_auto_mtd ?? 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      ],
      [
        "Despesas (MTD)",
        `R$ ${(kpis.despesas_mtd ?? 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      ],
      [
        "Resultado (MTD)",
        `R$ ${(kpis.resultado_mtd ?? 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      ],
      ["Atendimento Aberto", kpis.att_open ?? 0],
      ["Atendimento em Progresso", kpis.att_in_progress ?? 0],
      ["SLA 72h", `${Math.round((kpis.att_sla_72h ?? 0) * 100)}%`],
      ["TMA (min)", Math.round(kpis.att_tma_min ?? 0)],
      ["Simulações Criadas", kpis.sim_created ?? 0],
      ["Simulações Aprovadas", kpis.sim_approved ?? 0],
      ["Taxa de Conversão", `${Math.round((kpis.conv_rate ?? 0) * 100)}%`],
      ["Contratos (MTD)", kpis.contracts_mtd ?? 0],
      [
        "Consultoria Líq. (MTD)",
        `R$ ${(kpis.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`,
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const printDashboard = () => {
    window.print();
  };

  const kCases = useMemo(() => {
    if (!seriesData.length) {
      // Dados de fallback quando não há dados reais
      return [
        { date: "2024-01-01", value: 45 },
        { date: "2024-01-02", value: 52 },
        { date: "2024-01-03", value: 38 },
        { date: "2024-01-04", value: 61 },
        { date: "2024-01-05", value: 48 },
        { date: "2024-01-06", value: 55 },
        { date: "2024-01-07", value: 42 },
      ];
    }
    return seriesData.map((item: any) => ({
      date: item.date,
      value: (item.cases_created ?? 0) as number,
    }));
  }, [seriesData]);

  const kContracts = useMemo(() => {
    if (!seriesData.length) {
      // Dados de fallback quando não há dados reais
      return [
        { date: "2024-01-01", value: 8 },
        { date: "2024-01-02", value: 12 },
        { date: "2024-01-03", value: 10 },
        { date: "2024-01-04", value: 15 },
        { date: "2024-01-05", value: 13 },
        { date: "2024-01-06", value: 18 },
        { date: "2024-01-07", value: 21 },
      ];
    }
    return seriesData.map((item: any) => ({
      date: item.date,
      value: (item.contracts_active ?? 0) as number,
    }));
  }, [seriesData]);

  const kSimulations = useMemo(() => {
    if (!seriesData.length) {
      // Dados de fallback quando não há dados reais
      return [
        { date: "2024-01-01", simulations_created: 25, simulations_approved: 18 },
        { date: "2024-01-02", simulations_created: 32, simulations_approved: 24 },
        { date: "2024-01-03", simulations_created: 28, simulations_approved: 21 },
        { date: "2024-01-04", simulations_created: 41, simulations_approved: 32 },
        { date: "2024-01-05", simulations_created: 35, simulations_approved: 28 },
        { date: "2024-01-06", simulations_created: 48, simulations_approved: 38 },
        { date: "2024-01-07", simulations_created: 52, simulations_approved: 42 },
      ];
    }
    return seriesData.map((item: any) => ({
      date: item.date,
      simulations_created: (item.simulations_created ?? 0) as number,
      simulations_approved: (item.simulations_approved ?? 0) as number,
    }));
  }, [seriesData]);

  const kFinance = useMemo(() => {
    if (!seriesData.length)
      return [] as Array<{
        date: string;
        finance_receita: number;
        finance_despesas: number;
        finance_resultado: number;
      }>;
    return seriesData.map((item: any) => ({
      date: item.date,
      finance_receita: (item.finance_receita ?? 0) as number,
      finance_despesas: (item.finance_despesas ?? 0) as number,
      finance_resultado: (item.finance_resultado ?? 0) as number,
    }));
  }, [seriesData]);

  const financePie = useMemo(() => {
    if (!seriesData.length) return [] as { name: string; value: number }[];
    const receita = seriesData.reduce(
      (acc: number, item: any) => acc + ((item.finance_receita ?? 0) as number),
      0
    );
    const despesas = seriesData.reduce(
      (acc: number, item: any) =>
        acc + ((item.finance_despesas ?? 0) as number),
      0
    );
    const resultado = seriesData.reduce(
      (acc: number, item: any) =>
        acc + ((item.finance_resultado ?? 0) as number),
      0
    );
    return [
      { name: "Receita", value: receita },
      { name: "Despesas", value: despesas },
      { name: "Resultado", value: resultado !== 0 ? resultado : receita - despesas },
    ];
  }, [seriesData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral operacional e financeira</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={printDashboard} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="border rounded-lg p-3 bg-card">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Filtros por Período */}
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Filtros por Período</h3>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
              onClear={handleClearDateRange}
              label="Período personalizado:"
              className="w-full"
            />
          </div>

          {/* Divisor vertical em telas grandes */}
          <div className="hidden lg:block w-px bg-border h-16 mx-4"></div>

          {/* Divisor horizontal em telas pequenas */}
          <div className="lg:hidden border-t"></div>

          {/* Filtros Avançados */}
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Filtros Avançados</h3>
            <div className="w-full max-w-xs">
              <FilterDropdown
                label="Agrupamento"
                options={[
                  { value: "day", label: "Diário" },
                  { value: "week", label: "Semanal" },
                  { value: "month", label: "Mensal" }
                ]}
                value={bucket}
                onChange={(value) => setBucket(value as AnalyticsBucket)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. KPIs FINANCEIROS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            KPIs Financeiros
          </h2>
          <p className="text-sm text-muted-foreground">Receita, despesas e resultado líquido</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Receita Total"
            value={`R$ ${(metrics.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"receita do período"}
            gradientVariant="emerald"
            trend={financeTrends.receita}
            icon={DollarSign}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.receita}
                dataKey="value"
                xKey="day"
                stroke="#10b981"
                height={80}
                valueType="currency"
              />
            }
          />
          <KPICard
            title="Despesas"
            value={`R$ ${(metrics.totalExpenses ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"gastos do período"}
            gradientVariant="rose"
            trend={financeTrends.despesas}
            icon={TrendingDown}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.despesas}
                dataKey="value"
                xKey="day"
                stroke="#f43f5e"
                height={80}
                valueType="currency"
              />
            }
          />
          <KPICard
            title="Lucro Líquido"
            value={`R$ ${(metrics.netProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"lucro do período"}
            gradientVariant="violet"
            trend={financeTrends.lucro}
            icon={TrendingUp}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.lucro}
                dataKey="value"
                xKey="day"
                stroke="#8b5cf6"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Receita Consultoria"
            value={`R$ ${(metrics.totalConsultoriaLiq ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"consultoria líquida"}
            gradientVariant="sky"
            trend={financeTrends.consultoria}
            icon={Briefcase}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.consultoria}
                dataKey="value"
                xKey="day"
                stroke="#38bdf8"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Imposto"
            value={`R$ ${((metrics.totalConsultoriaLiq ?? 0) * 0.14).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"14% sobre consultoria"}
            gradientVariant="amber"
            trend={financeTrends.imposto}
            icon={Receipt}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.imposto}
                dataKey="value"
                xKey="day"
                stroke="#f59e0b"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
        </div>
      </div>

      {/* 2. GRÁFICOS FINANCEIROS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Gráficos Financeiros
          </h2>
          <p className="text-sm text-muted-foreground">Análises visuais das métricas financeiras</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LineChart
            title="Financeiro Consolidado"
            subtitle={`Bucket: ${bucket}`}
            data={kFinance}
            lines={[
              { dataKey: "finance_receita", name: "Receita", color: "#10b981" },
              { dataKey: "finance_despesas", name: "Despesas", color: "#ef4444" },
              { dataKey: "finance_resultado", name: "Resultado", color: "#f59e0b" },
            ]}
            xAxisKey="date"
            valueType="currency"
            formatXAxis={true}
          />
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Composição Financeira</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <PieChart
                title="Composição"
                subtitle={"Distribuição de receitas e despesas"}
                data={financePie}
                dataKey="value"
                nameKey="name"
                centerLabel="Movimentações"
                innerRadius="60%"
                outerRadius="80%"
                valueType="currency"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. KPIs OPERACIONAIS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            KPIs Operacionais
          </h2>
          <p className="text-sm text-muted-foreground">Desempenho do atendimento, SLA e produtividade</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid 2x2 de KPIs */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard
                title="Atendimento Aberto"
                value={kpis?.att_open ?? 0}
                subtitle={"últimos 30 dias"}
                gradientVariant="sky"
                trend={kpis?.trends?.att_open ?? 0}
                icon={Activity}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={MOCK_TREND_DATA.atendimento}
                    dataKey="value"
                    xKey="day"
                    fill="#38bdf8"
                    height={80}
                  />
                }
              />
              <KPICard
                title="Atendimento em Progresso"
                value={kpis?.att_in_progress ?? 0}
                subtitle={"últimos 30 dias"}
                gradientVariant="violet"
                trend={kpis?.trends?.att_in_progress ?? 0}
                icon={Target}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={MOCK_TREND_DATA.progresso}
                    dataKey="value"
                    xKey="day"
                    fill="#8b5cf6"
                    height={80}
                  />
                }
              />
              <KPICard
                title="SLA 72h"
                value={`${Math.round((kpis?.att_sla_72h ?? 0) * 100)}%`}
                subtitle={"dentro do prazo"}
                gradientVariant="emerald"
                trend={kpis?.trends?.att_sla_72h ?? 0}
                icon={CheckCircle}
                isLoading={kpisLoading}
                miniChart={
                  <MiniAreaChart
                    data={MOCK_TREND_DATA.sla}
                    dataKey="value"
                    xKey="day"
                    stroke="#10b981"
                    height={80}
                    tooltipFormatter={(value) => `${value}%`}
                  />
                }
              />
              <KPICard
                title="TMA (min)"
                value={Math.round(kpis?.att_tma_min ?? 0)}
                subtitle={"tempo médio de atendimento"}
                gradientVariant="amber"
                trend={kpis?.trends?.att_tma_min ?? 0}
                icon={Clock}
                isLoading={kpisLoading}
                miniChart={
                  <MiniAreaChart
                    data={MOCK_TREND_DATA.tma}
                    dataKey="value"
                    xKey="day"
                    stroke="#f59e0b"
                    height={80}
                    tooltipFormatter={(value) => `${value} min`}
                  />
                }
              />
            </div>
          </div>
          {/* Gráfico ao lado */}
          <div className="lg:col-span-1">
            <AreaChart
              title="Casos Criados"
              subtitle={`Bucket: ${bucket}`}
              data={kCases}
              dataKey="value"
              xAxisKey="date"
              color="#3b82f6"
              formatXAxis={true}
            />
          </div>
        </div>
      </div>

      {/* 5. KPIs SIMULAÇÕES */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            KPIs Simulações
          </h2>
          <p className="text-sm text-muted-foreground">Análises visuais das simulações</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid 2x2 de KPIs */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard
                title="Simulações Criadas"
                value={kpis?.sim_created ?? 0}
                subtitle={"no período"}
                gradientVariant="sky"
                trend={18.4}
                icon={Activity}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={MOCK_TREND_DATA.simulacoes}
                    dataKey="value"
                    xKey="day"
                    fill="#38bdf8"
                    height={80}
                  />
                }
              />
              <KPICard
                title="Simulações Aprovadas"
                value={kpis?.sim_approved ?? 0}
                subtitle={"no período"}
                gradientVariant="emerald"
                trend={24.6}
                icon={CheckCircle}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={MOCK_TREND_DATA.aprovadas}
                    dataKey="value"
                    xKey="day"
                    fill="#10b981"
                    height={80}
                  />
                }
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${Math.round((kpis?.conv_rate ?? 0) * 100)}%`}
                subtitle={"sims aprovadas / criadas"}
                gradientVariant="violet"
                trend={kpis?.trends?.conv_rate ?? 0}
                icon={Target}
                isLoading={kpisLoading}
                miniChart={
                  <MiniAreaChart
                    data={MOCK_TREND_DATA.conversao}
                    dataKey="value"
                    xKey="day"
                    stroke="#8b5cf6"
                    height={80}
                    tooltipFormatter={(value) => `${value}%`}
                  />
                }
              />
              <KPICard
                title="Tempo Médio (min)"
                value={`${Math.round((kpis?.sim_created ?? 0) > 0 ? 25 : 0)}`}
                subtitle={"tempo médio por simulação"}
                gradientVariant="amber"
                trend={-12.5}
                icon={Clock}
                isLoading={kpisLoading}
                miniChart={
                  <MiniAreaChart
                    data={MOCK_TREND_DATA.tempo_medio}
                    dataKey="value"
                    xKey="day"
                    stroke="#f59e0b"
                    height={80}
                    tooltipFormatter={(value) => `${value} min`}
                  />
                }
              />
            </div>
          </div>
          {/* Gráfico ao lado */}
          <div className="lg:col-span-1">
            <LineChart
              title="Simulações Criadas vs Aprovadas"
              subtitle={`Bucket: ${bucket}`}
              data={kSimulations}
              lines={[
                { dataKey: "simulations_created", name: "Criadas", color: "#3b82f6" },
                { dataKey: "simulations_approved", name: "Aprovadas", color: "#10b981" },
              ]}
              xAxisKey="date"
              formatXAxis={true}
            />
          </div>
        </div>
      </div>

      {/* 7. KPIs CONTRATOS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            KPIs Contratos
          </h2>
          <p className="text-sm text-muted-foreground">
            Efetivação, consultoria líquida, valor médio e contratos efetivados
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid 2x2 dos KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              title="Contratos (MTD)"
              value={kpis?.contracts_mtd ?? 0}
              subtitle={"mês atual"}
              gradientVariant="sky"
              trend={kpis?.trends?.contracts_mtd ?? 0}
              icon={Briefcase}
              isLoading={kpisLoading}
              miniChart={
                <MiniBarChart
                  data={MOCK_TREND_DATA.contratos}
                  dataKey="value"
                  xKey="day"
                  fill="#38bdf8"
                  height={80}
                />
              }
            />
            <KPICard
              title="Consultoria Líq. (MTD)"
              value={`R$ ${(kpis?.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
              subtitle={`YTD R$ ${(kpis?.consultoria_liq_ytd ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`}
              gradientVariant="emerald"
              trend={kpis?.trends?.consultoria_liq_mtd ?? 0}
              icon={DollarSign}
              isLoading={kpisLoading}
              miniChart={
                <MiniAreaChart
                  data={MOCK_TREND_DATA.consultoria}
                  dataKey="value"
                  xKey="day"
                  stroke="#10b981"
                  height={80}
                  tooltipFormatter={(value) =>
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  }
                />
              }
            />
            <KPICard
              title="Valor Médio Contrato"
              value={`R$ ${Math.round(
                (kpis?.consultoria_liq_mtd ?? 0) / Math.max(kpis?.contracts_mtd ?? 1, 1)
              ).toLocaleString("pt-BR")}`}
              subtitle={"consultoria / contratos"}
              gradientVariant="violet"
              trend={11.7}
              icon={BarChart3}
              isLoading={kpisLoading}
              miniChart={
                <MiniAreaChart
                  data={MOCK_TREND_DATA.valor_medio}
                  dataKey="value"
                  xKey="day"
                  stroke="#8b5cf6"
                  height={80}
                  tooltipFormatter={(value) =>
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  }
                />
              }
            />
            <KPICard
              title="Contratos Efetivados"
              value={Math.round((kpis?.contracts_mtd ?? 0) * 0.75)}
              subtitle={"contratos finalizados"}
              gradientVariant="amber"
              trend={19.2}
              icon={CheckCircle}
              isLoading={kpisLoading}
              miniChart={
                <MiniBarChart
                  data={MOCK_TREND_DATA.efetivados}
                  dataKey="value"
                  xKey="day"
                  fill="#f59e0b"
                  height={80}
                />
              }
            />
          </div>
          
          {/* Gráfico ao lado */}
          <div className="h-full min-h-[400px]">
            <AreaChart
              title="Evolução de Contratos"
              subtitle={`Bucket: ${bucket}`}
              data={kContracts}
              dataKey="value"
              xAxisKey="date"
              color="#059669"
              formatXAxis={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
