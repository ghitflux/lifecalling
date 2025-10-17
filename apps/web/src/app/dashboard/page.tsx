"use client";
import { useMemo, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  KPICard,
  LineChart,
  AreaChart,
  BarChart,
  PieChart,
  PositiveNegativeBarChart,
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
import {
  convertFinanceToMiniChart,
  convertAttendanceToMiniChart,
  convertSimulationsToMiniChart,
  convertContractsToMiniChart,
  generateFallbackTrendData,
  generateEmptyData
} from "@/lib/chart-utils";
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

// Funções para converter dados reais em formato de mini-chart
const generateRealTrendData = (seriesData: any[], kpis: any) => {
  // Dados financeiros baseados em séries reais
  const receita = convertFinanceToMiniChart(seriesData, 'finance_receita', kpis?.receita_auto_mtd || 0);
  const despesas = convertFinanceToMiniChart(seriesData, 'finance_despesas', 0);
  const lucro = convertFinanceToMiniChart(seriesData, 'finance_resultado', kpis?.resultado_mtd || 0);
  const consultoria = generateFallbackTrendData(kpis?.consultoria_liq_mtd || 0, kpis?.trends?.consultoria_liq_mtd || 0);

  // Dados de atendimento baseados em KPIs reais
  const atendimento = generateFallbackTrendData(kpis?.att_open || 0, kpis?.trends?.att_open || 0);
  const progresso = generateFallbackTrendData(kpis?.att_in_progress || 0, kpis?.trends?.att_in_progress || 0);
  const sla = generateFallbackTrendData((kpis?.att_sla_72h || 0) * 100, kpis?.trends?.att_sla_72h || 0);
  const tma = generateFallbackTrendData(kpis?.att_tma_min || 0, kpis?.trends?.att_tma_min || 0);

  // Dados de simulações baseados em séries reais
  const simulacoes = convertSimulationsToMiniChart(seriesData, 'simulations_created');
  const aprovadas = convertSimulationsToMiniChart(seriesData, 'simulations_approved');
  const conversao = generateFallbackTrendData((kpis?.conv_rate || 0) * 100, kpis?.trends?.conv_rate || 0);

  // Dados de contratos baseados em KPIs reais
  const contratos = generateFallbackTrendData(kpis?.contracts_mtd || 0, kpis?.trends?.contracts_mtd || 0);

  return {
    receita,
    despesas,
    lucro,
    consultoria,
    atendimento,
    progresso,
    sla,
    tma,
    simulacoes,
    aprovadas,
    conversao,
    contratos,
  };
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

  // Gerar dados reais para mini-charts
  const realTrendData = useMemo(() => {
    return generateRealTrendData(seriesData, kpis);
  }, [seriesData, kpis]);

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
    consultoria: calculateTrend(metrics.totalConsultoriaLiq || 0, previousMetrics.totalConsultoriaLiq || 0),
    lucro: calculateTrend(metrics.netProfit || 0, previousMetrics.netProfit || 0),
    despesas: calculateTrend(metrics.totalExpenses || 0, previousMetrics.totalExpenses || 0),
    imposto: calculateTrend(
      (metrics.totalConsultoriaLiq || 0) * 0.14,
      (previousMetrics.totalConsultoriaLiq || 0) * 0.14
    ),
    comissoes: calculateTrend(metrics.totalCommissions || 0, previousMetrics.totalCommissions || 0)
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
      // Retornar array vazio quando não há dados reais
      return [];
    }
    return seriesData.map((item: any) => ({
      date: item.date,
      value: (item.cases_created ?? 0) as number,
    }));
  }, [seriesData]);

  const kContracts = useMemo(() => {
    if (!seriesData.length) {
      // Retornar array vazio quando não há dados reais
      return [];
    }
    return seriesData.map((item: any) => ({
      date: item.date,
      value: (item.contracts_active ?? 0) as number,
    }));
  }, [seriesData]);

  const kSimulations = useMemo(() => {
    if (!seriesData.length) {
      // Retornar array vazio quando não há dados reais
      return [];
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
    const receita = metrics.totalRevenue || 0;
    const despesas = metrics.totalExpenses || 0;
    const resultado = receita - despesas;

    return [
      { name: "Receita", value: receita },
      { name: "Despesas", value: despesas },
      { name: "Resultado", value: resultado }
    ];
  }, [metrics]);

  // Calcular saldo disponível (Receita - Despesas)
  const saldoDisponivel = useMemo(() => {
    return metrics.netProfit || 0;
  }, [metrics]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPICard
            title="Receita Total"
            value={`R$ ${(metrics.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"Consultoria + Receitas Manuais + Externas"}
            gradientVariant="emerald"
            trend={financeTrends.receita}
            icon={DollarSign}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={realTrendData.receita}
                dataKey="value"
                xKey="day"
                stroke="#10b981"
                height={80}
                valueType="currency"
              />
            }
          />
          <KPICard
            title="Receita Consultoria Líquida"
            value={`R$ ${(metrics.totalConsultoriaLiq ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"consultorias líquidas"}
            gradientVariant="sky"
            trend={financeTrends.consultoria}
            icon={Briefcase}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={realTrendData.consultoria}
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
            title="Lucro Líquido"
            value={`R$ ${(metrics.netProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"Receita - Despesas"}
            gradientVariant="violet"
            trend={financeTrends.lucro}
            icon={TrendingUp}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={realTrendData.lucro}
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
            title="Despesas"
            value={`R$ ${(metrics.totalExpenses ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"gastos do período"}
            gradientVariant="rose"
            trend={financeTrends.despesas}
            icon={TrendingDown}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={realTrendData.despesas}
                dataKey="value"
                xKey="day"
                stroke="#f43f5e"
                height={80}
                valueType="currency"
              />
            }
          />
          <KPICard
            title="Imposto"
            value={`R$ ${(((metrics.totalConsultoriaLiq ?? 0) * 0.14) + (metrics.totalManualTaxes ?? 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={"14% Receita Líquida"}
            gradientVariant="amber"
            trend={financeTrends.imposto}
            icon={Receipt}
            isLoading={metricsLoading}
            miniChart={
              <MiniAreaChart
                data={realTrendData.consultoria}
                dataKey="value"
                xKey="day"
                stroke="#f59e0b"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Comissões Geradas"
            value={`R$ ${(metrics.totalCommissions || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle="Comissões pagas no período"
            isLoading={metricsLoading}
            gradientVariant="amber"
            trend={financeTrends.comissoes}
            icon={Wallet}
            miniChart={
              <MiniAreaChart
                data={realTrendData.despesas}
                dataKey="value"
                xKey="day"
                stroke="#f97316"
                height={80}
                valueType="currency"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                centerLabel="Saldo Disponível"
                centerValue={saldoDisponivel}
                colors={["#22c55e", "#ef4444", "#8b5cf6"]} // Verde para receita, vermelho para despesas, violeta para resultado
                innerRadius="60%"
                outerRadius="80%"
                valueType="currency"
              />
            </CardContent>
          </Card>
          <PositiveNegativeBarChart
            title="Receitas vs Despesas"
            subtitle="Volume diário em BRL"
            data={kFinance}
            positiveDataKey="finance_receita"
            negativeDataKey="finance_despesas"
            xAxisKey="date"
            positiveColor="#22c55e"
            negativeColor="#ef4444"
            valueType="currency"
            formatXAxis={true}
          />
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
                    data={realTrendData.atendimento}
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
                    data={realTrendData.progresso}
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
                    data={realTrendData.sla}
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
                    data={realTrendData.tma}
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
                trend={kpis?.trends?.sim_created ?? 0}
                icon={Activity}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={realTrendData.simulacoes}
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
                trend={kpis?.trends?.sim_approved ?? 0}
                icon={CheckCircle}
                isLoading={kpisLoading}
                miniChart={
                  <MiniBarChart
                    data={realTrendData.aprovadas}
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
                    data={realTrendData.conversao}
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
                value={`${Math.round(kpis?.sim_avg_time_min ?? 0)}`}
                subtitle={"tempo médio por simulação"}
                gradientVariant="amber"
                trend={kpis?.trends?.sim_avg_time_min ?? 0}
                icon={Clock}
                isLoading={kpisLoading}
                miniChart={
                  <MiniAreaChart
                    data={realTrendData.tma}
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
                  data={realTrendData.contratos}
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
                  data={realTrendData.consultoria}
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
              trend={kpis?.trends?.avg_contract_value ?? 0}
              icon={BarChart3}
              isLoading={kpisLoading}
              miniChart={
                <MiniAreaChart
                  data={realTrendData.contratos}
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
              value={kpis?.contracts_finalized ?? 0}
              subtitle={"contratos finalizados"}
              gradientVariant="amber"
              trend={kpis?.trends?.contracts_finalized ?? 0}
              icon={CheckCircle}
              isLoading={kpisLoading}
              miniChart={
                <MiniBarChart
                  data={realTrendData.contratos}
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
