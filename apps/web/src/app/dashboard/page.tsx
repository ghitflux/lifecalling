"use client";
import { useMemo, useState } from "react";
import { KPICard, LineChart, AreaChart, BarChart, PieChart, Card, CardContent, CardHeader, CardTitle } from "@lifecalling/ui";
import { useAnalyticsKpis, useAnalyticsSeries } from "@/lib/hooks";
import { Calendar, Activity, CheckCircle, Target, Briefcase, DollarSign, TrendingUp } from "lucide-react";

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Atendimento Aberto"
          value={kpis?.att_open ?? 0}
          subtitle={"últimos 30 dias"}
          icon={Activity}
          color="info"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Atendimento em Progresso"
          value={kpis?.att_in_progress ?? 0}
          subtitle={"últimos 30 dias"}
          icon={Target}
          color="primary"
          isLoading={kpisLoading}
        />
        <KPICard
          title="SLA 72h"
          value={`${Math.round((kpis?.att_sla_72h ?? 0) * 100)}%`}
          subtitle={"dentro do prazo"}
          icon={Calendar}
          color="success"
          isLoading={kpisLoading}
        />
        <KPICard
          title="TMA (min)"
          value={Math.round(kpis?.att_tma_min ?? 0)}
          subtitle={"tempo médio de atendimento"}
          icon={Activity}
          color="warning"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Simulações Criadas"
          value={kpis?.sim_created ?? 0}
          subtitle={"no período"}
          icon={Activity}
          color="info"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Simulações Aprovadas"
          value={kpis?.sim_approved ?? 0}
          subtitle={"no período"}
          icon={CheckCircle}
          color="success"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${Math.round((kpis?.conv_rate ?? 0) * 100)}%`}
          subtitle={"sims aprovadas / criadas"}
          icon={TrendingUp}
          color="primary"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Contratos (MTD)"
          value={kpis?.contracts_mtd ?? 0}
          subtitle={"mês atual"}
          icon={Briefcase}
          color="info"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Consultoria Líq. (MTD)"
          value={`R$ ${(kpis?.consultoria_liq_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={`YTD R$ ${(kpis?.consultoria_liq_ytd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="success"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Receita Automática (MTD)"
          value={`R$ ${(kpis?.receita_auto_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={"estimada (86% consultoria)"}
          icon={DollarSign}
          color="primary"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Resultado (MTD)"
          value={`R$ ${(kpis?.resultado_mtd ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={"receitas - despesas"}
          icon={DollarSign}
          color="warning"
          isLoading={kpisLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChart
          title="Casos Criados"
          subtitle={`Bucket: ${bucket}`}
          data={kCases}
          dataKey="value"
          xAxisKey="date"
          color="#5865f2"
        />
        <LineChart
          title="Simulações"
          subtitle={`Bucket: ${bucket}`}
          data={kSimulations}
          lines={[
            { dataKey: "simulations_created", name: "Criadas", color: "#5865f2" },
            { dataKey: "simulations_approved", name: "Aprovadas", color: "#57f287" },
          ]}
          xAxisKey="date"
        />
        <BarChart
          title="Contratos Ativos"
          subtitle={`Bucket: ${bucket}`}
          data={kContracts}
          dataKey="value"
          xAxisKey="date"
          color="#57f287"
        />
        <LineChart
          title="Financeiro"
          subtitle={`Bucket: ${bucket}`}
          data={kFinance}
          lines={[
            { dataKey: "finance_receita", name: "Receita", color: "#57f287" },
            { dataKey: "finance_despesas", name: "Despesas", color: "#ed4245" },
            { dataKey: "finance_resultado", name: "Resultado", color: "#fef08a" },
          ]}
          xAxisKey="date"
        />
        <Card>
          <CardHeader>
            <CardTitle>Composição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              title="Composição"
              subtitle={"Distribuição de receitas e despesas"}
              data={financePie}
              dataKey="value"
              nameKey="name"
              centerLabel="Movimentações"
              innerRadius="70%"
              outerRadius="90%"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
