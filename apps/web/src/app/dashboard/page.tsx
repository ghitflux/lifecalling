"use client";
import { useMemo, useState } from "react";
import { KPICard, LineChart, AreaChart, BarChart, PieChart, Card, CardContent, CardHeader, CardTitle, MiniAreaChart, MiniBarChart, Button } from "@lifecalling/ui";
import { useAnalyticsKpis, useAnalyticsSeries } from "@/lib/hooks";
import { Calendar, Activity, CheckCircle, Target, Briefcase, DollarSign, TrendingUp, TrendingDown, Download, Printer, Users, Clock, BarChart3, PieChart as PieChartIcon } from "lucide-react";

type AnalyticsBucket = "day" | "week" | "month";

const iso = (dt: Date) => dt.toISOString();
const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));

// Dados mockados para mini gráficos (últimos 7 dias)
const MOCK_TREND_DATA = {
  receita: [
    { day: "D1", value: 15000 },
    { day: "D2", value: 18000 },
    { day: "D3", value: 22000 },
    { day: "D4", value: 19000 },
    { day: "D5", value: 25000 },
    { day: "D6", value: 28000 },
    { day: "D7", value: 32000 }
  ],
  despesas: [
    { day: "D1", value: 8000 },
    { day: "D2", value: 9500 },
    { day: "D3", value: 7800 },
    { day: "D4", value: 11000 },
    { day: "D5", value: 9200 },
    { day: "D6", value: 10500 },
    { day: "D7", value: 12000 }
  ],
  resultado: [
    { day: "D1", value: 7000 },
    { day: "D2", value: 8500 },
    { day: "D3", value: 14200 },
    { day: "D4", value: 8000 },
    { day: "D5", value: 15800 },
    { day: "D6", value: 17500 },
    { day: "D7", value: 20000 }
  ],
  atendimento: [
    { day: "D1", value: 45 },
    { day: "D2", value: 52 },
    { day: "D3", value: 38 },
    { day: "D4", value: 61 },
    { day: "D5", value: 48 },
    { day: "D6", value: 55 },
    { day: "D7", value: 42 }
  ],
  progresso: [
    { day: "D1", value: 12 },
    { day: "D2", value: 18 },
    { day: "D3", value: 15 },
    { day: "D4", value: 22 },
    { day: "D5", value: 19 },
    { day: "D6", value: 25 },
    { day: "D7", value: 16 }
  ],
  sla: [
    { day: "D1", value: 85 },
    { day: "D2", value: 92 },
    { day: "D3", value: 88 },
    { day: "D4", value: 95 },
    { day: "D5", value: 91 },
    { day: "D6", value: 97 },
    { day: "D7", value: 94 }
  ],
  tma: [
    { day: "D1", value: 45 },
    { day: "D2", value: 38 },
    { day: "D3", value: 52 },
    { day: "D4", value: 35 },
    { day: "D5", value: 41 },
    { day: "D6", value: 33 },
    { day: "D7", value: 39 }
  ],
  simulacoes: [
    { day: "D1", value: 25 },
    { day: "D2", value: 32 },
    { day: "D3", value: 28 },
    { day: "D4", value: 41 },
    { day: "D5", value: 35 },
    { day: "D6", value: 48 },
    { day: "D7", value: 52 }
  ],
  aprovadas: [
    { day: "D1", value: 18 },
    { day: "D2", value: 24 },
    { day: "D3", value: 21 },
    { day: "D4", value: 32 },
    { day: "D5", value: 28 },
    { day: "D6", value: 38 },
    { day: "D7", value: 42 }
  ],
  conversao: [
    { day: "D1", value: 72 },
    { day: "D2", value: 75 },
    { day: "D3", value: 75 },
    { day: "D4", value: 78 },
    { day: "D5", value: 80 },
    { day: "D6", value: 79 },
    { day: "D7", value: 81 }
  ],
  contratos: [
    { day: "D1", value: 8 },
    { day: "D2", value: 12 },
    { day: "D3", value: 10 },
    { day: "D4", value: 15 },
    { day: "D5", value: 13 },
    { day: "D6", value: 18 },
    { day: "D7", value: 21 }
  ],
  consultoria: [
    { day: "D1", value: 12000 },
    { day: "D2", value: 15500 },
    { day: "D3", value: 14200 },
    { day: "D4", value: 18800 },
    { day: "D5", value: 16900 },
    { day: "D6", value: 22100 },
    { day: "D7", value: 25400 }
  ],
  // Novos dados para KPIs adicionais
  margem: [
    { day: "D1", value: 35 },
    { day: "D2", value: 42 },
    { day: "D3", value: 38 },
    { day: "D4", value: 45 },
    { day: "D5", value: 41 },
    { day: "D6", value: 48 },
    { day: "D7", value: 52 }
  ],
  clientes: [
    { day: "D1", value: 125 },
    { day: "D2", value: 132 },
    { day: "D3", value: 128 },
    { day: "D4", value: 145 },
    { day: "D5", value: 138 },
    { day: "D6", value: 152 },
    { day: "D7", value: 165 }
  ],
  satisfacao: [
    { day: "D1", value: 4.2 },
    { day: "D2", value: 4.5 },
    { day: "D3", value: 4.3 },
    { day: "D4", value: 4.7 },
    { day: "D5", value: 4.4 },
    { day: "D6", value: 4.8 },
    { day: "D7", value: 4.6 }
  ],
  produtividade: [
    { day: "D1", value: 85 },
    { day: "D2", value: 92 },
    { day: "D3", value: 88 },
    { day: "D4", value: 95 },
    { day: "D5", value: 91 },
    { day: "D6", value: 97 },
    { day: "D7", value: 94 }
  ],
  tempo_medio: [
    { day: "D1", value: 25 },
    { day: "D2", value: 22 },
    { day: "D3", value: 28 },
    { day: "D4", value: 20 },
    { day: "D5", value: 24 },
    { day: "D6", value: 18 },
    { day: "D7", value: 21 }
  ],
  rejeitadas: [
    { day: "D1", value: 5 },
    { day: "D2", value: 3 },
    { day: "D3", value: 7 },
    { day: "D4", value: 4 },
    { day: "D5", value: 6 },
    { day: "D6", value: 2 },
    { day: "D7", value: 4 }
  ],
  valor_medio: [
    { day: "D1", value: 2500 },
    { day: "D2", value: 2800 },
    { day: "D3", value: 2650 },
    { day: "D4", value: 3200 },
    { day: "D5", value: 2950 },
    { day: "D6", value: 3400 },
    { day: "D7", value: 3650 }
  ],
  efetivados: [
    { day: "D1", value: 6 },
    { day: "D2", value: 9 },
    { day: "D3", value: 7 },
    { day: "D4", value: 12 },
    { day: "D5", value: 10 },
    { day: "D6", value: 15 },
    { day: "D7", value: 18 }
  ]
};

export default function DashboardPage() {
  const [from, setFrom] = useState<string>(()=>{
    const now = new Date();
    const past = new Date(now.getTime() - 30*24*60*60*1000);
    return iso(startOfDayUTC(past));
  });
  const [to, setTo] = useState<string>(()=> iso(new Date()));
  const [bucket, setBucket] = useState<AnalyticsBucket>("day");

  // Função para gerar filtros rápidos de mês
  const getQuickMonthFilters = () => {
    const now = new Date();
    const filters = [];
    
    // Mês atual
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.push({
      label: "Este Mês",
      from: iso(startOfDayUTC(currentMonth)),
      to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59))
    });
    
    // Últimos 3 meses
    for (let i = 1; i <= 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      filters.push({
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        from: iso(startOfDayUTC(monthStart)),
        to: iso(monthEnd)
      });
    }
    
    return filters;
  };

  // Funções de exportação
  const exportToCSV = () => {
    if (!kpis) return;
    
    const csvData = [
      ['Métrica', 'Valor'],
      ['Receita Automática (MTD)', `R$ ${(kpis.receita_auto_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ['Despesas (MTD)', `R$ ${(kpis.despesas_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ['Resultado (MTD)', `R$ ${(kpis.resultado_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ['Atendimento Aberto', kpis.att_open ?? 0],
      ['Atendimento em Progresso', kpis.att_in_progress ?? 0],
      ['SLA 72h', `${Math.round((kpis.att_sla_72h ?? 0) * 100)}%`],
      ['TMA (min)', Math.round(kpis.att_tma_min ?? 0)],
      ['Simulações Criadas', kpis.sim_created ?? 0],
      ['Simulações Aprovadas', kpis.sim_approved ?? 0],
      ['Taxa de Conversão', `${Math.round((kpis.conv_rate ?? 0) * 100)}%`],
      ['Contratos (MTD)', kpis.contracts_mtd ?? 0],
      ['Consultoria Líq. (MTD)', `R$ ${(kpis.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printDashboard = () => {
    window.print();
  };

  const range = useMemo(()=>({ from, to }), [from, to]);

  const { data: kpis, isLoading: kpisLoading } = useAnalyticsKpis(range);
  const { data: series } = useAnalyticsSeries(range, bucket);
  const seriesData = useMemo(() => series?.series ?? [], [series]);

  const kCases = useMemo(()=>{
    if (!seriesData.length) return [] as Array<{ date: string; value: number }>;
    return seriesData.map((item: any)=>({
      date: item.date,
      value: (item.cases_created ?? 0) as number,
    }));
  },[seriesData]);
  const kContracts = useMemo(()=>{
    if (!seriesData.length) return [] as Array<{ date: string; value: number }>;
    return seriesData.map((item: any)=>({
      date: item.date,
      value: (item.contracts_active ?? 0) as number,
    }));
  },[seriesData]);
  const kSimulations = useMemo(()=>{
    if (!seriesData.length) return [] as Array<{ date: string; simulations_created: number; simulations_approved: number }>;
    return seriesData.map((item: any)=>({
      date: item.date,
      simulations_created: (item.simulations_created ?? 0) as number,
      simulations_approved: (item.simulations_approved ?? 0) as number,
    }));
  },[seriesData]);
  const kFinance = useMemo(()=>{
    if (!seriesData.length) return [] as Array<{ date: string; finance_receita: number; finance_despesas: number; finance_resultado: number }>;
    return seriesData.map((item: any)=>({
      date: item.date,
      finance_receita: (item.finance_receita ?? 0) as number,
      finance_despesas: (item.finance_despesas ?? 0) as number,
      finance_resultado: (item.finance_resultado ?? 0) as number,
    }));
  },[seriesData]);
  const financePie = useMemo(()=>{
    if (!seriesData.length) return [] as { name:string, value:number }[];
    const receita = seriesData.reduce((acc: number, item: any) => acc + ((item.finance_receita ?? 0) as number), 0);
    const despesas = seriesData.reduce((acc: number, item: any) => acc + ((item.finance_despesas ?? 0) as number), 0);
    const resultado = seriesData.reduce((acc: number, item: any) => acc + ((item.finance_resultado ?? 0) as number), 0);
    return [
      { name: "Receita", value: receita },
      { name: "Despesas", value: despesas },
      { name: "Resultado", value: resultado !== 0 ? resultado : (receita - despesas) },
    ];
  },[seriesData]);

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

      {/* Filtros Rápidos por Mês */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Filtros Rápidos</h3>
        <div className="flex flex-wrap gap-2">
          {getQuickMonthFilters().map((filter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom(filter.from);
                setTo(filter.to);
              }}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">De</label>
          <input
            type="datetime-local"
            className="border rounded-md px-3 py-2 bg-background"
            value={from.replace("Z", "").slice(0,16)}
            onChange={(e)=>{
              const v = e.target.value;
              const dt = new Date(v);
              setFrom(iso(startOfDayUTC(dt)));
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Até</label>
          <input
            type="datetime-local"
            className="border rounded-md px-3 py-2 bg-background"
            value={to.replace("Z", "").slice(0,16)}
            onChange={(e)=>{
              const v = e.target.value;
              const dt = new Date(v);
              setTo(iso(dt));
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Bucket</label>
          <select
            className="border rounded-md px-3 py-2 bg-background"
            value={bucket}
            onChange={(e)=> setBucket(e.target.value as AnalyticsBucket)}
          >
            <option value="day">Diário</option>
            <option value="week">Semanal</option>
            <option value="month">Mensal</option>
          </select>
        </div>
      </div>

      {/* 1. KPIs FINANCEIROS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">💰 KPIs Financeiros</h2>
          <p className="text-sm text-muted-foreground">Receitas, despesas, resultado e margem</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Receita Automática (MTD)"
            value={`R$ ${(kpis?.receita_auto_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"estimada (86% consultoria)"}
            gradientVariant="emerald"
            trend={15.2}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.receita}
                dataKey="value"
                xKey="day"
                stroke="#10b981"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Despesas (MTD)"
            value={`R$ ${(kpis?.despesas_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"gastos do mês"}
            gradientVariant="rose"
            trend={-8.5}
            icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.despesas}
                dataKey="value"
                xKey="day"
                stroke="#f43f5e"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Resultado (MTD)"
            value={`R$ ${(kpis?.resultado_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"receitas - despesas"}
            gradientVariant="violet"
            trend={22.8}
            icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.resultado}
                dataKey="value"
                xKey="day"
                stroke="#8b5cf6"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Margem Líquida"
            value={`${Math.round((kpis?.resultado_mtd ?? 0) / (kpis?.receita_auto_mtd ?? 1) * 100)}%`}
            subtitle={"resultado / receita"}
            gradientVariant="sky"
            trend={8.3}
            icon={<BarChart3 className="h-5 w-5 text-sky-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.margem}
                dataKey="value"
                xKey="day"
                stroke="#38bdf8"
                height={80}
                tooltipFormatter={(value) => `${value}%`}
              />
            }
          />
        </div>
      </div>

      {/* 2. GRÁFICOS FINANCEIROS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📊 Gráficos Financeiros</h2>
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
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. KPIs OPERACIONAIS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">⚙️ KPIs Operacionais</h2>
          <p className="text-sm text-muted-foreground">Desempenho do atendimento, SLA e produtividade</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Atendimento Aberto"
            value={kpis?.att_open ?? 0}
            subtitle={"últimos 30 dias"}
            gradientVariant="sky"
            trend={5.3}
            icon={<Activity className="h-5 w-5 text-sky-500" />}
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
            trend={12.1}
            icon={<Target className="h-5 w-5 text-violet-500" />}
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
            trend={3.7}
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
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
            trend={-6.2}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
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

      {/* 4. GRÁFICOS OPERACIONAIS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📈 Gráficos Operacionais</h2>
          <p className="text-sm text-muted-foreground">Análises visuais das métricas operacionais</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AreaChart
            title="Casos Criados"
            subtitle={`Bucket: ${bucket}`}
            data={kCases}
            dataKey="value"
            xAxisKey="date"
            color="#3b82f6"
          />
          <BarChart
            title="Volume de Casos"
            subtitle={`Bucket: ${bucket}`}
            data={kCases}
            dataKey="value"
            xAxisKey="date"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* 5. KPIs SIMULAÇÕES */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">🧮 KPIs Simulações</h2>
          <p className="text-sm text-muted-foreground">Conversão, performance e tempo médio de cálculos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Simulações Criadas"
            value={kpis?.sim_created ?? 0}
            subtitle={"no período"}
            gradientVariant="sky"
            trend={18.4}
            icon={<Activity className="h-5 w-5 text-sky-500" />}
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
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
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
            trend={4.2}
            icon={<Target className="h-5 w-5 text-violet-500" />}
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
            icon={<Clock className="h-5 w-5 text-amber-500" />}
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

      {/* 6. GRÁFICOS SIMULAÇÕES */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📊 Gráficos Simulações</h2>
          <p className="text-sm text-muted-foreground">Análises visuais das métricas de simulações</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LineChart
            title="Simulações Criadas vs Aprovadas"
            subtitle={`Bucket: ${bucket}`}
            data={kSimulations}
            lines={[
              { dataKey: "simulations_created", name: "Criadas", color: "#3b82f6" },
              { dataKey: "simulations_approved", name: "Aprovadas", color: "#10b981" },
            ]}
            xAxisKey="date"
          />
          <BarChart
            title="Simulações Aprovadas"
            subtitle={`Bucket: ${bucket}`}
            data={kSimulations}
            dataKey="simulations_approved"
            xAxisKey="date"
            color="#10b981"
          />
        </div>
      </div>

      {/* 7. KPIs CONTRATOS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📝 KPIs Contratos</h2>
          <p className="text-sm text-muted-foreground">Efetivação, consultoria líquida, valor médio e contratos efetivados</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Contratos (MTD)"
            value={kpis?.contracts_mtd ?? 0}
            subtitle={"mês atual"}
            gradientVariant="sky"
            trend={16.8}
            icon={<Briefcase className="h-5 w-5 text-sky-500" />}
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
            value={`R$ ${(kpis?.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={`YTD R$ ${(kpis?.consultoria_liq_ytd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            gradientVariant="emerald"
            trend={28.3}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.consultoria}
                dataKey="value"
                xKey="day"
                stroke="#10b981"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              />
            }
          />
          <KPICard
            title="Valor Médio Contrato"
            value={`R$ ${Math.round((kpis?.consultoria_liq_mtd ?? 0) / Math.max(kpis?.contracts_mtd ?? 1, 1)).toLocaleString("pt-BR")}`}
            subtitle={"consultoria / contratos"}
            gradientVariant="violet"
            trend={11.7}
            icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
            isLoading={kpisLoading}
            miniChart={
              <MiniAreaChart
                data={MOCK_TREND_DATA.valor_medio}
                dataKey="value"
                xKey="day"
                stroke="#8b5cf6"
                height={80}
                tooltipFormatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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
            icon={<CheckCircle className="h-5 w-5 text-amber-500" />}
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
      </div>

      {/* 8. GRÁFICOS CONTRATOS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📈 Gráficos Contratos</h2>
          <p className="text-sm text-muted-foreground">Análises visuais das métricas de contratos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BarChart
            title="Contratos Ativos"
            subtitle={`Bucket: ${bucket}`}
            data={kContracts}
            dataKey="value"
            xAxisKey="date"
            color="#10b981"
          />
          <AreaChart
            title="Evolução de Contratos"
            subtitle={`Bucket: ${bucket}`}
            data={kContracts}
            dataKey="value"
            xAxisKey="date"
            color="#059669"
          />
        </div>
      </div>


    </div>
  );
}
