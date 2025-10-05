/* packages/ui/src/MiniAreaChart.tsx */
import React, { useId } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { cn } from "./lib/utils";
import { formatDateForChart, formatValueForChart } from "./lib/chart-formatters";

interface MiniAreaChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  xKey: string;
  stroke?: string;
  height?: number;
  className?: string;
  tooltipFormatter?: (value: number) => string;
  valueType?: 'currency' | 'percentage' | 'number';
  formatXAxis?: boolean;
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

export function MiniAreaChart({
  data,
  dataKey,
  xKey,
  stroke = "#38bdf8",
  height = 96,
  className,
  tooltipFormatter,
  valueType = 'number',
  formatXAxis = false
}: MiniAreaChartProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");

  // Usar formatter customizado ou formatação automática baseada no tipo
  const finalFormatter = tooltipFormatter || ((value: number) => formatValueForChart(value, valueType));
  
  // Verificar se há dados para exibir
  const hasData = data && data.length > 0;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`areaGradient${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey={xKey} hide tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "rgba(148, 163, 184, 0.35)" }}
              content={(props) => <MinimalTooltip {...props} formatter={finalFormatter} />}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              fill={`url(#areaGradient${gradientId})`}
              strokeWidth={2.5}
              isAnimationActive
              animationDuration={600}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-xs text-muted-foreground">Sem dados</div>
        </div>
      )}
    </div>
  );
}
