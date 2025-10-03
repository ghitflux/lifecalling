/* packages/ui/src/PieChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { cn } from "./lib/utils";

interface PieChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  innerRadius?: number | string;
  outerRadius?: number | string;
  centerLabel?: string;
}

const DEFAULT_COLORS = [
  "#5865f2", // Primary
  "#57f287", // Success
  "#fee75c", // Warning
  "#ed4245", // Danger
  "#38bdf8", // Info (sky-400)
  "#99aab5", // Secondary
  "#f38ba8", // Pink
  "#22c55e", // Green
  "#f97316", // Orange
  "#a855f7"  // Purple
];

const COLOR_CLASSES = [
  "bg-[#5865f2]",
  "bg-[#57f287]",
  "bg-[#fee75c]",
  "bg-[#ed4245]",
  "bg-[#38bdf8]",
  "bg-[#99aab5]",
  "bg-[#f38ba8]",
  "bg-[#22c55e]",
  "bg-[#f97316]",
  "bg-[#a855f7]",
];

export function PieChart({
  title,
  subtitle,
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  innerRadius = "70%",
  outerRadius = "90%",
  centerLabel,
}: PieChartProps) {
  const total = Array.isArray(data)
    ? data.reduce((sum, item) => sum + (Number(item?.[dataKey]) || 0), 0)
    : 0;

  const MinimalTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    const name = p?.payload?.[nameKey] ?? p?.name;
    const value = Number(p?.payload?.[dataKey] ?? p?.value) || 0;
    return (
      <div className="bg-card px-3 py-2 text-xs text-foreground shadow-xl border" style={{ borderRadius: '12px' }}>
        {name}: {value.toLocaleString()}
      </div>
    );
  };

  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Donut Chart Area */}
        <div className="col-span-8 relative">
          <div className="relative w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Tooltip content={(props) => <MinimalTooltip {...props} />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={6}
                  dataKey={dataKey}
                  nameKey={nameKey}
                  isAnimationActive
                  animationDuration={500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />
                  ))}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-semibold text-foreground">
                {total.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {centerLabel ?? "Total"}
              </div>
            </div>
          </div>
        </div>

        {/* Legend Area */}
        <div className="col-span-4 flex flex-col justify-center gap-3">
          {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  COLOR_CLASSES[index % COLOR_CLASSES.length]
                )}
              />
              <span className="text-sm text-muted-foreground flex-1 truncate">
                {String(entry?.[nameKey] ?? "")}
              </span>
              <span className="text-sm text-foreground">
                {Number(entry?.[dataKey] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
}
