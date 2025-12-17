"use client";

import { useQuery } from "@tanstack/react-query";
import { AgentsAPI, MetricsAPI } from "@/lib/dashboard-api";
import { api } from "@/lib/api";

export const useKPIs = (range: string) =>
  useQuery({
    queryKey: ["dashboard", "kpis", range],
    queryFn: () => MetricsAPI.kpis(range),
    staleTime: 60_000,
  });

export const useLineSeries = (metric: string, range: string) =>
  useQuery({
    queryKey: ["dashboard", "line", metric, range],
    queryFn: () => MetricsAPI.line(metric, range),
    staleTime: 60_000,
  });

export const useBarSeries = (metric: string, range: string) =>
  useQuery({
    queryKey: ["dashboard", "bars", metric, range],
    queryFn: () => MetricsAPI.bars(metric, range),
    staleTime: 60_000,
  });

export const useAreaSeries = (metric: string, range: string) =>
  useQuery({
    queryKey: ["dashboard", "area", metric, range],
    queryFn: () => MetricsAPI.area(metric, range),
    staleTime: 60_000,
  });

export const useDonutSeries = (metric: string, range: string) =>
  useQuery({
    queryKey: ["dashboard", "donut", metric, range],
    queryFn: () => MetricsAPI.donut(metric, range),
    staleTime: 60_000,
  });

export const useAgentRanking = (range: string, limit = 10) =>
  useQuery({
    queryKey: ["dashboard", "ranking", range, limit],
    queryFn: () => AgentsAPI.ranking(range, limit),
    staleTime: 60_000,
  });

export const useAgentMetrics = (from?: string, to?: string) =>
  useQuery({
    queryKey: ["analytics", "agent-metrics", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const response = await api.get(`/analytics/agent-metrics?${params.toString()}`);
      return response.data;
    },
    staleTime: 300_000, // 5 minutos ao invés de 1
    gcTime: 600_000, // 10 minutos de cache
    refetchOnWindowFocus: false, // Não refazer query ao focar janela
    refetchInterval: false, // Desabilitar refresh automático
    refetchOnMount: false, // Não refazer query ao montar (usar cache se válido)
    enabled: !!(from && to), // Só executar se tiver ambos parâmetros
  });
