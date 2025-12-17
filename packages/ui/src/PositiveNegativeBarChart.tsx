/* packages/ui/src/PositiveNegativeBarChart.tsx */
import React from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from "recharts";
import { ChartContainer } from "./ChartContainer";
import { formatDateForChart, formatValueForChart } from "./lib/chart-formatters";

interface PositiveNegativeBarChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  positiveDataKey: string; // Chave para dados positivos (receita)
  negativeDataKey: string; // Chave para dados negativos (despesas)
  xAxisKey: string;
  positiveColor?: string;
  negativeColor?: string;
  valueType?: 'currency' | 'percentage' | 'number';
  formatXAxis?: boolean;
}

export function PositiveNegativeBarChart({
  title,
  subtitle,
  data,
  positiveDataKey,
  negativeDataKey,
  xAxisKey,
  positiveColor = "#22c55e", // Verde para receita
  negativeColor = "#ef4444", // Vermelho para despesas
  valueType = 'currency',
  formatXAxis = true
}: PositiveNegativeBarChartProps) {

  // Processar dados para incluir valores negativos para despesas
  const processedData = data.map(item => ({
    ...item,
    [negativeDataKey]: -(Math.abs(item[negativeDataKey] || 0)) // Garantir que despesas sejam negativas
  }));

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
          {payload.map((entry: any, index: number) => {
            const value = Math.abs(entry.value); // Mostrar valor absoluto no tooltip
            const formattedValue = formatValueForChart(value, valueType);
            const isPositive = entry.dataKey === positiveDataKey;
            const label = isPositive ? "Receita" : "Despesas";

            return (
              <p key={index} className="text-sm text-muted-foreground">
                <span className="font-semibold" style={{ color: entry.color }}>
                  {label}: {formattedValue}
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Formatter para eixo X quando é data
  const xAxisFormatter = (value: string) => {
    return formatXAxis ? formatDateForChart(value) : value;
  };

  // Formatter para eixo Y
  const yAxisFormatter = (value: number) => {
    if (valueType === 'currency') {
      return formatValueForChart(Math.abs(value), 'currency');
    }
    return Math.abs(value);
  };

  // Encontrar valores máximo e mínimo para ajustar o domínio do eixo Y
  const maxPositive = Math.max(...processedData.map(item => item[positiveDataKey] || 0));
  const maxNegative = Math.min(...processedData.map(item => item[negativeDataKey] || 0));

  // Adicionar margem de 10% para melhor visualização
  const margin = Math.max(maxPositive, Math.abs(maxNegative)) * 0.1;
  const yDomain = [maxNegative - margin, maxPositive + margin];

  return (
    <ChartContainer title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={processedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={xAxisFormatter}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => String(yAxisFormatter(value))}
            domain={yDomain}
          />
          <Tooltip content={customTooltip} />

          {/* Linha de referência no zero */}
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />

          {/* Barras positivas (receita) */}
          <Bar
            dataKey={positiveDataKey}
            fill={positiveColor}
            radius={[4, 4, 0, 0]}
            name="Receita"
          />

          {/* Barras negativas (despesas) */}
          <Bar
            dataKey={negativeDataKey}
            fill={negativeColor}
            radius={[0, 0, 4, 4]}
            name="Despesas"
          />
        </RechartsBar>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
