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
import { formatDateForChart, formatValueForChart } from "./lib/chart-formatters";

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  horizontal?: boolean;
  valueType?: 'currency' | 'percentage' | 'number';
  formatXAxis?: boolean;
}

export function BarChart({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  color = "#5865f2",
  horizontal = false,
  valueType = 'number',
  formatXAxis = false
}: BarChartProps) {
  // Formatter customizado para tooltip
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedLabel = formatXAxis ? formatDateForChart(label) : label;
      const formattedValue = formatValueForChart(value, valueType);

      return (
        <div
          className="bg-card border border-border rounded-xl p-3 shadow-lg"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px"
          }}
        >
          <p className="text-sm font-medium text-foreground">{formattedLabel}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold" style={{ color: payload[0].color }}>
              {formattedValue}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Formatter para eixo X quando é data
  const xAxisFormatter = (value: string) => {
    return formatXAxis ? formatDateForChart(value) : value;
  };

  // Formatter para eixo Y quando é valor monetário
  const yAxisFormatter = (value: number) => {
    if (valueType === 'currency') {
      return formatValueForChart(value, 'currency');
    }
    return value;
  };

  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} layout={horizontal ? "horizontal" : "vertical"}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={valueType === 'currency' ? (value: any) => String(yAxisFormatter(value as number)) : undefined}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={formatXAxis ? xAxisFormatter : undefined}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={formatXAxis ? xAxisFormatter : undefined}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={valueType === 'currency' ? (value: any) => String(yAxisFormatter(value as number)) : undefined}
              />
            </>
          )}
          <Tooltip content={customTooltip} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
