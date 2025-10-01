/* packages/ui/src/PieChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface PieChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#5865f2", // Primary
  "#57f287", // Success
  "#fee75c", // Warning
  "#ed4245", // Danger
  "#5865f2", // Info
  "#99aab5", // Secondary
  "#f38ba8", // Pink
  "#a6e3a1", // Green
  "#fab387", // Orange
  "#cba6f7"  // Purple
];

export function PieChart({
  title,
  subtitle,
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS
}: PieChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius-sm)"
            }}
          />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
