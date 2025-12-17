/* packages/ui/src/LineChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { formatDateForChart, formatValueForChart } from "./lib/chart-formatters";

interface LineChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  valueType?: 'currency' | 'percentage' | 'number';
  formatXAxis?: boolean;
}

export function LineChart({
  title,
  subtitle,
  data,
  lines,
  xAxisKey,
  valueType = 'number',
  formatXAxis = false
}: LineChartProps) {
  // Formatter customizado para tooltip
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = formatXAxis ? formatDateForChart(label) : label;

      return (
        <div
          className="bg-card border border-border rounded-xl p-3 shadow-lg"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px"
          }}
        >
          <p className="text-sm font-medium text-foreground mb-2">{formattedLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.name}: {formatValueForChart(entry.value, valueType)}
              </span>
            </p>
          ))}
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

  // Verificar se há dados para exibir
  const hasData = data && data.length > 0;

  return (
    <ChartContainer title={title} subtitle={subtitle}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLine data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xAxisKey}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={formatXAxis ? xAxisFormatter : undefined}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={valueType === 'currency' ? (value: any) => String(yAxisFormatter(value as number)) : undefined}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                name={line.name}
                dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLine>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-muted-foreground text-sm">Nenhum dado disponível</div>
            <div className="text-muted-foreground text-xs mt-1">
              Os dados aparecerão aqui quando estiverem disponíveis
            </div>
          </div>
        </div>
      )}
    </ChartContainer>
  );
}
