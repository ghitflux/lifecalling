/* packages/ui/src/BarChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  horizontal?: boolean;
}

export function BarChart({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  color = "#5865f2",
  horizontal = false
}: BarChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} layout={horizontal ? "horizontal" : "vertical"}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {horizontal ? (
            <>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px"
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </ChartContainer>
  );
}