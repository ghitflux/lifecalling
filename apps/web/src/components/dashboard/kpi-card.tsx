"use client";

import { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { DashboardCard } from "./ui/dashboard-card";

interface KpiCardProps {
  label: string;
  value: number | string;
  deltaPct: number;
  trend: "up" | "down";
  spark?: number[];
  icon?: ReactNode;
}

export function KpiCard({ label, value, deltaPct, trend, spark = [], icon }: KpiCardProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString("pt-BR") : value;
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  const trendClasses = trend === "up" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300";

  return (
    <DashboardCard className="kpi-gradient">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-white">{formattedValue}</h3>
          <div className={`mt-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${trendClasses}`}>
            <TrendIcon size={14} />
            <span>{deltaPct.toFixed(1)}%</span>
            <span className="ml-1 text-white/50">vs período anterior</span>
          </div>
        </div>
        {icon && <div className="text-white/60">{icon}</div>}
      </div>

      {spark.length > 0 && (
        <div className="mt-6 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((value, index) => ({ index, value }))}>
              <defs>
                <linearGradient id="kpiSparkGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="rgb(129,140,248)" fill="url(#kpiSparkGradient)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
