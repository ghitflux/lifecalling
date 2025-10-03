"use client";
import { useMemo, useState } from "react";
import { KPICard, LineChart, AreaChart, BarChart, PieChart, Card, CardContent, CardHeader, CardTitle } from "@lifecalling/ui";
import { useAnalyticsKpis, useAnalyticsSeries } from "@/lib/hooks";
import { Calendar, Activity, CheckCircle, Target, Briefcase, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

type AnalyticsBucket = "day" | "week" | "month";

const iso = (dt: Date) => dt.toISOString();
const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));

export default function DashboardPage() {
  const [from, setFrom] = useState<string>(()=>{
    const now = new Date();
    const past = new Date(now.getTime() - 30*24*60*60*1000);
    return iso(startOfDayUTC(past));
  });
  const [to, setTo] = useState<string>(()=> iso(new Date()));
  const [bucket, setBucket] = useState<AnalyticsBucket>("day");

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

      {/* Métricas Operacionais */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📊 Métricas Operacionais</h2>
          <p className="text-sm text-muted-foreground">Desempenho do atendimento e SLA</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Atendimento Aberto"
            value={kpis?.att_open ?? 0}
            subtitle={"últimos 30 dias"}
            icon={Activity}
            gradientVariant="blue"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Atendimento em Progresso"
            value={kpis?.att_in_progress ?? 0}
            subtitle={"últimos 30 dias"}
            icon={Target}
            gradientVariant="violet"
            isLoading={kpisLoading}
          />
          <KPICard
            title="SLA 72h"
            value={`${Math.round((kpis?.att_sla_72h ?? 0) * 100)}%`}
            subtitle={"dentro do prazo"}
            icon={Calendar}
            gradientVariant="emerald"
            isLoading={kpisLoading}
          />
          <KPICard
            title="TMA (min)"
            value={Math.round(kpis?.att_tma_min ?? 0)}
            subtitle={"tempo médio de atendimento"}
            icon={Activity}
            gradientVariant="amber"
            isLoading={kpisLoading}
          />
        </div>
      </div>

      {/* Métricas de Simulações */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">🧮 Métricas de Simulações</h2>
          <p className="text-sm text-muted-foreground">Conversão e performance de cálculos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Simulações Criadas"
            value={kpis?.sim_created ?? 0}
            subtitle={"no período"}
            icon={Activity}
            gradientVariant="blue"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Simulações Aprovadas"
            value={kpis?.sim_approved ?? 0}
            subtitle={"no período"}
            icon={CheckCircle}
            gradientVariant="emerald"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Taxa de Conversão"
            value={`${Math.round((kpis?.conv_rate ?? 0) * 100)}%`}
            subtitle={"sims aprovadas / criadas"}
            icon={TrendingUp}
            gradientVariant="violet"
            isLoading={kpisLoading}
          />
        </div>
      </div>

      {/* Métricas de Contratos */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📝 Métricas de Contratos</h2>
          <p className="text-sm text-muted-foreground">Efetivação e consultoria líquida</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPICard
            title="Contratos (MTD)"
            value={kpis?.contracts_mtd ?? 0}
            subtitle={"mês atual"}
            icon={Briefcase}
            gradientVariant="blue"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Consultoria Líq. (MTD)"
            value={`R$ ${(kpis?.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={`YTD R$ ${(kpis?.consultoria_liq_ytd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            gradientVariant="emerald"
            isLoading={kpisLoading}
          />
        </div>
      </div>

      {/* Métricas Financeiras */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">💰 Métricas Financeiras</h2>
          <p className="text-sm text-muted-foreground">Receitas, despesas e resultado</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Receita Automática (MTD)"
            value={`R$ ${(kpis?.receita_auto_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"estimada (86% consultoria)"}
            icon={DollarSign}
            gradientVariant="emerald"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Despesas (MTD)"
            value={`R$ ${(kpis?.despesas_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"gastos do mês"}
            icon={TrendingDown}
            gradientVariant="rose"
            isLoading={kpisLoading}
          />
          <KPICard
            title="Resultado (MTD)"
            value={`R$ ${(kpis?.resultado_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={"receitas - despesas"}
            icon={DollarSign}
            gradientVariant="violet"
            isLoading={kpisLoading}
          />
        </div>
      </div>

      {/* Gráficos Operacionais */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📈 Análises Operacionais</h2>
          <p className="text-sm text-muted-foreground">Evolução temporal dos casos</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Gráficos de Simulações */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📊 Análises de Simulações</h2>
          <p className="text-sm text-muted-foreground">Performance e conversão de cálculos</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Gráficos de Contratos */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">📝 Análises de Contratos</h2>
          <p className="text-sm text-muted-foreground">Efetivação e volume contratual</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Gráficos Financeiros */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">💰 Análises Financeiras</h2>
          <p className="text-sm text-muted-foreground">Receitas, despesas e resultados</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <BarChart
            title="Receitas por Período"
            subtitle={`Bucket: ${bucket}`}
            data={kFinance}
            dataKey="finance_receita"
            xAxisKey="date"
            color="#10b981"
          />
          <BarChart
            title="Despesas por Período"
            subtitle={`Bucket: ${bucket}`}
            data={kFinance}
            dataKey="finance_despesas"
            xAxisKey="date"
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  );
}
