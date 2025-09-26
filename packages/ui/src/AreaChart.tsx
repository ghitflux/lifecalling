/* packages/ui/src/AreaChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface AreaChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export function AreaChart({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  color = "#654ff7"
}: AreaChartProps) {
  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">


        <RechartsArea data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius-sm)"
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={1}
            fill="url(#colorGradient)"
          />
        </RechartsArea>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
