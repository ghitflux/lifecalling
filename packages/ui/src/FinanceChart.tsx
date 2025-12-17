/* packages/ui/src/FinanceChart.tsx */
import React from "react";
import { LineChart } from "./LineChart";
import { Card } from "./Card";

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface FinanceChartProps {
  revenue: TimeSeriesDataPoint[];
  expenses: TimeSeriesDataPoint[];
  tax: TimeSeriesDataPoint[];
  netProfit: TimeSeriesDataPoint[];
  className?: string;
}

export function FinanceChart({
  revenue,
  expenses,
  tax,
  netProfit,
  className
}: FinanceChartProps) {
  // Combinar todos os dados em um único array
  const combinedData = revenue.map((rev, index) => ({
    date: rev.date,
    receitas: rev.value,
    despesas: expenses[index]?.value || 0,
    impostos: tax[index]?.value || 0,
    lucroLiquido: netProfit[index]?.value || 0
  }));

  const lines = [
    {
      dataKey: "receitas",
      name: "Receitas",
      color: "hsl(142, 76%, 36%)" // success color
    },
    {
      dataKey: "despesas",
      name: "Despesas",
      color: "hsl(24, 95%, 53%)" // warning color
    },
    {
      dataKey: "impostos",
      name: "Impostos (14%)",
      color: "hsl(0, 84%, 60%)" // danger color
    },
    {
      dataKey: "lucroLiquido",
      name: "Lucro Líquido",
      color: "hsl(221, 83%, 53%)" // info/primary color
    }
  ];

  return (
    <Card className={className}>
      <LineChart
        title="Evolução Financeira"
        subtitle="Últimos 6 meses"
        data={combinedData}
        lines={lines}
        xAxisKey="date"
      />
    </Card>
  );
}
