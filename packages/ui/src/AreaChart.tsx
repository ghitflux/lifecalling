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
import { formatDateForChart, formatValueForChart } from "./lib/chart-formatters";

interface AreaChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  valueType?: 'currency' | 'percentage' | 'number';
  formatXAxis?: boolean;
}

export function AreaChart({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  color = "#5865f2",
  valueType = 'number',
  formatXAxis = false
}: AreaChartProps) {
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

  // Verificar se há dados para exibir
  const hasData = data && data.length > 0;

  return (
    <ChartContainer title={title} subtitle={subtitle}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsArea data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xAxisKey}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={formatXAxis ? xAxisFormatter : undefined}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={valueType === 'currency' ? (value: any) => String(yAxisFormatter(value)) : undefined}
            />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </RechartsArea>
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
