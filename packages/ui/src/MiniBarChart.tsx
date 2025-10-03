/* packages/ui/src/MiniBarChart.tsx */
import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { cn } from "./lib/utils";

interface MiniBarChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  xKey: string;
  fill?: string;
  height?: number;
  className?: string;
  tooltipFormatter?: (value: number) => string;
}

const defaultFormatter = (value: number) =>
  typeof value === "number" ? value.toLocaleString() : String(value ?? "");

const MinimalTooltip = ({ active, payload, formatter = defaultFormatter }: any) => {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-xl ring-1 ring-white/10">
      {formatter(value)}
    </div>
  );
};

export function MiniBarChart({
  data,
  dataKey,
  xKey,
  fill = "#f97316",
  height = 96,
  className,
  tooltipFormatter = defaultFormatter,
}: MiniBarChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey={xKey} hide axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            content={(props) => <MinimalTooltip {...props} formatter={tooltipFormatter} />}
          />
          <Bar
            dataKey={dataKey}
            fill={fill}
            radius={[6, 6, 6, 6]}
            maxBarSize={24}
            isAnimationActive
            animationDuration={480}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
