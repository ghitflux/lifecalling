"use client";

import { useQuery } from "@tanstack/react-query";
import { AgentsAPI, MetricsAPI } from "@/lib/dashboard-api";

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
