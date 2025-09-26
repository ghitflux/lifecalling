/* apps/web/src/app/dashboard/page.tsx */
import { Grid, KPICard, AreaChart, EsteiraCard } from "@lifecalling/ui";
import { TrendingUp, Users, DollarSign, FileCheck } from "lucide-react";

const mockData = [
  { month: 'Jan', value: 2400 },
  { month: 'Fev', value: 1398 },
  { month: 'Mar', value: 9800 },
  { month: 'Abr', value: 3908 },
  { month: 'Mai', value: 4800 },
  { month: 'Jun', value: 3800 },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <Grid cols={4}>
        <KPICard
          title="Casos Ativos"
          value="124"
          trend={12.5}
          icon={Users}
          color="primary"
        />
        <KPICard
          title="Taxa de Aprovação"
          value="89%"
          trend={3.2}
          icon={TrendingUp}
          color="success"
        />
        <KPICard
          title="Volume Financeiro"
          value="R$ 2.4M"
          trend={-2.1}
          icon={DollarSign}
          color="warning"
        />
        <KPICard
          title="Contratos Fechados"
          value="42"
          subtitle="Este mês"
          icon={FileCheck}
          color="info"
        />
      </Grid>

      {/* Chart */}
      <AreaChart
        title="Evolução de Casos"
        subtitle="Últimos 6 meses"
        data={mockData}
        dataKey="value"
        xAxisKey="month"
      />

      {/* Recent Cases */}
      <Grid cols={3}>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Casos Recentes</h3>
          <p className="text-muted-foreground">Nenhum caso encontrado</p>
        </div>
      </Grid>
    </div>
  );
}
