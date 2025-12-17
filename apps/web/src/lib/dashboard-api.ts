import { api } from "@/lib/api";

export type KPI = {
  id: string;
  label: string;
  value: number;
  deltaPct: number;
  trend: "up" | "down";
  spark?: number[];
};

export type Point = {
  ts: string;
  value: number;
};

export type Series = {
  metric: string;
  points: Point[];
};

export type Slice = {
  label: string;
  value: number;
};

export type DonutPayload = {
  title: string;
  slices: Slice[];
  total: number;
};

export type RankingRow = {
  agentId: string;
  name: string;
  avatar?: string;
  approvals: number;
  sims: number;
  contracts: number;
  tmaSec: number;
  slaPct: number;
  score: number;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calcDelta(current: number, previous: number): { deltaPct: number; trend: "up" | "down" } {
  const prev = previous === 0 ? (current === 0 ? 1 : Math.abs(current)) : previous;
  const deltaPct = ((current - prev) / Math.abs(prev)) * 100;
  const safeDelta = Number.isFinite(deltaPct) ? deltaPct : 0;
  return {
    deltaPct: Number(safeDelta.toFixed(1)),
    trend: safeDelta >= 0 ? "up" : "down",
  };
}

function rangeToPeriod(range: string): string {
  if (range === "12m") return "12m";
  if (range === "90d") return "9m";
  return "6m";
}

export const MetricsAPI = {
  async kpis(range: string): Promise<KPI[]> {
    const [statsRes, chartRes, trendsRes] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/chart-data", { params: { period: rangeToPeriod(range) } }),
      api.get("/dashboard/monthly-trends"),
    ]);

    const stats = statsRes.data ?? {};
    const chartData: Array<{ month: string; value: number }> = chartRes.data?.data ?? [];
    const trendData: Array<{ month: string; novos: number; finalizados: number; volume: number }> = trendsRes.data?.data ?? [];

    const sparkSeries = chartData.map((item) => toNumber(item.value));
    const lastTrend = trendData[trendData.length - 1] ?? { novos: stats.activeCases ?? 0, finalizados: stats.activeCases ?? 0, volume: stats.totalVolume ?? 0 };
    const prevTrend = trendData[trendData.length - 2] ?? lastTrend;

    const { deltaPct: activeDelta, trend: activeTrend } = calcDelta(toNumber(lastTrend.novos), toNumber(prevTrend.novos));

    const approvalCurrent = lastTrend.novos > 0 ? (toNumber(lastTrend.finalizados) / Math.max(1, toNumber(lastTrend.novos))) * 100 : toNumber(stats.approvalRate);
    const approvalPrev = prevTrend.novos > 0 ? (toNumber(prevTrend.finalizados) / Math.max(1, toNumber(prevTrend.novos))) * 100 : approvalCurrent;
    const approvalDelta = calcDelta(approvalCurrent, approvalPrev);

    const { deltaPct: volumeDelta, trend: volumeTrend } = calcDelta(toNumber(lastTrend.volume), toNumber(prevTrend.volume));

    const pendingEstimateCurrent = Math.max(toNumber(stats.pendingSimulations), Math.max(0, toNumber(lastTrend.novos) - toNumber(lastTrend.finalizados)));
    const pendingEstimatePrev = Math.max(1, Math.max(0, toNumber(prevTrend.novos) - toNumber(prevTrend.finalizados)));
    const pendingDelta = calcDelta(pendingEstimateCurrent, pendingEstimatePrev);

    return [
      {
        id: "active_cases",
        label: "Atendimentos Ativos",
        value: toNumber(stats.activeCases),
        deltaPct: activeDelta,
        trend: activeTrend,
        spark: sparkSeries,
      },
      {
        id: "approval_rate",
        label: "Taxa de Aprovação",
        value: Number(approvalCurrent.toFixed(1)),
        deltaPct: approvalDelta.deltaPct,
        trend: approvalDelta.trend,
        spark: trendData.map((item) => {
          const ratio = item.novos > 0 ? (toNumber(item.finalizados) / Math.max(1, toNumber(item.novos))) * 100 : approvalCurrent;
          return Number(ratio.toFixed(1));
        }),
      },
      {
        id: "total_volume",
        label: "Volume Financeiro",
        value: Number(toNumber(stats.totalVolume).toFixed(2)),
        deltaPct: volumeDelta,
        trend: volumeTrend,
        spark: trendData.map((item) => Number(toNumber(item.volume).toFixed(0))),
      },
      {
        id: "sims_pending",
        label: "Simulações Pendentes",
        value: toNumber(stats.pendingSimulations),
        deltaPct: pendingDelta.deltaPct,
        trend: pendingDelta.trend,
        spark: trendData.map((item) => Math.max(0, toNumber(item.novos) - toNumber(item.finalizados))),
      },
    ];
  },

  async line(metric: string, range: string): Promise<Series> {
    const response = await api.get("/dashboard/chart-data", { params: { period: rangeToPeriod(range) } });
    const points: Point[] = (response.data?.data ?? []).map((item: any) => ({
      ts: item.month,
      value: toNumber(item.value),
    }));
    return { metric, points };
  },

  async bars(metric: string, range: string): Promise<Series> {
    const response = await api.get("/dashboard/monthly-trends", { params: { period: rangeToPeriod(range) } });
    const points: Point[] = (response.data?.data ?? []).map((item: any) => ({
      ts: item.month,
      value: toNumber(item.novos),
    }));
    return { metric, points };
  },

  async area(metric: string, range: string): Promise<Series> {
    const response = await api.get("/dashboard/monthly-trends", { params: { period: rangeToPeriod(range) } });
    const points: Point[] = (response.data?.data ?? []).map((item: any) => {
      const ratio = item.novos > 0 ? (toNumber(item.finalizados) / Math.max(1, toNumber(item.novos))) * 100 : 0;
      return {
        ts: item.month,
        value: Number(ratio.toFixed(1)),
      };
    });
    return { metric, points };
  },

  async donut(metric: string, range: string): Promise<DonutPayload> {
    const response = await api.get("/dashboard/status-breakdown", { params: { range } });
    const data = response.data ?? {};
    const slices: Slice[] = Object.entries(data)
      .map(([label, value]) => ({ label, value: toNumber(value) }))
      .filter((slice) => slice.value > 0);
    const total = slices.reduce((acc, slice) => acc + slice.value, 0);
    return {
      title: "Status dos Casos",
      slices,
      total,
    };
  },
};

export const AgentsAPI = {
  async ranking(range: string, limit = 10): Promise<RankingRow[]> {
    const response = await api.get("/dashboard/user-performance", { params: { range } });
    const list: Array<{ name: string; assigned: number; completed: number; efficiency: number }> = response.data?.data ?? [];

    return list
      .slice(0, limit)
      .map((item, index) => {
        const approvals = toNumber(item.completed);
        const assigned = toNumber(item.assigned);
        const efficiency = toNumber(item.efficiency);
        const tmaSec = Math.max(180, Math.round((100 - efficiency) * 12 + 180));
        const score = approvals * 10 + efficiency * 5 + assigned * 2;

        return {
          agentId: `${index}-${item.name}`,
          name: item.name,
          approvals,
          sims: assigned,
          contracts: approvals,
          tmaSec,
          slaPct: Number(efficiency.toFixed(1)),
          score,
        };
      });
  },
};