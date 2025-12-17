/* packages/ui/src/DonutChart.tsx */
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "./lib/utils";
import { formatValueForChart } from "./lib/chart-formatters";

interface DonutChartEntry {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DonutChartEntry[];
  className?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  colors?: string[];
  tooltipFormatter?: (entry: DonutChartEntry) => string;
  centerLabel?: string;
  valueType?: 'currency' | 'percentage' | 'number';
}

const DEFAULT_COLORS = ["#38bdf8", "#f97316", "#a855f7", "#22c55e", "#f43f5e"];

export function DonutChart({
  data,
  className,
  innerRadius = "60%",
  outerRadius = "90%",
  colors = DEFAULT_COLORS,
  tooltipFormatter,
  centerLabel,
  valueType = 'number'
}: DonutChartProps) {
  const total = Array.isArray(data) ? data.reduce((sum, d) => sum + (Number(d?.value) || 0), 0) : 0;

  const MinimalTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0]?.payload as DonutChartEntry;
    const formattedValue = tooltipFormatter 
      ? tooltipFormatter(entry) 
      : `${entry.name}: ${formatValueForChart(entry.value, valueType)}`;
    return (
      <div className="rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-xl ring-1 ring-white/10">
        {formattedValue}
      </div>
    );
  };
  return (
    <div className={cn("w-full min-h-[140px] relative", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={(props) => <MinimalTooltip {...props} formatter={tooltipFormatter} />} />
          <Pie
            data={data as any}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={6}
            strokeWidth={0}
            isAnimationActive
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-lg font-semibold text-foreground">
          {formatValueForChart(total, valueType)}
        </div>
        {centerLabel && (
          <div className="text-xs text-muted-foreground">{centerLabel}</div>
        )}
      </div>
    </div>
  );
}
