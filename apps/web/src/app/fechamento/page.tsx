"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useClosingQueue, useClosingApprove, useClosingReject, useClosingKpis } from "@/lib/hooks";
import {
  Button,
  Badge,
  CardFechamento,
  KPICard,
  MiniAreaChart,
  UnifiedFilter
} from "@lifecalling/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, User, Calendar, DollarSign, Building, X, CheckCircle, Clock, TrendingUp, Target, FileCheck } from "lucide-react";

function FechamentoContent() {
  useLiveCaseEvents();
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useClosingQueue();
  const approve = useClosingApprove();
  const reject = useClosingReject();

  // Estado para filtro por mês
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Hook para buscar dados de KPI do fechamento (com mês selecionado)
  const { data: kpis, isLoading: isLoadingKpis } = useClosingKpis({ month: selectedMonth });

  // Dados combinados com fallback para dados padrão
  const combinedKpis = useMemo(() => {
    if (kpis) return kpis;

    // Fallback para dados padrão enquanto carrega
    return {
      casos_pendentes: 0,
      casos_aprovados: 0,
      casos_reprovados: 0,
      taxa_aprovacao: 0,
      volume_financeiro: 0,
      consultoria_liquida: 0,
      meta_mensal: 50000, // Valor padrão
      trends: {
        casos_pendentes: 0,
        casos_aprovados: 0,
        taxa_aprovacao: 0,
        volume_financeiro: 0,
        consultoria_liquida: 0
      }
    };
  }, [kpis]);

  // Meses disponíveis para filtro
  const availableMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const value = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    return months;
  }, []);

  // Dados mockados de tendência para os mini gráficos
  const MOCK_TREND_DATA = {
    casos_pendentes: [
      { day: "D1", value: 8 },
      { day: "D2", value: 12 },
      { day: "D3", value: 10 },
      { day: "D4", value: 15 },
      { day: "D5", value: 13 },
      { day: "D6", value: 18 },
      { day: "D7", value: 16 },
    ],
    casos_aprovados: [
      { day: "D1", value: 6 },
      { day: "D2", value: 9 },
      { day: "D3", value: 8 },
      { day: "D4", value: 12 },
      { day: "D5", value: 11 },
      { day: "D6", value: 14 },
      { day: "D7", value: 13 },
    ],

    taxa_aprovacao: [
      { day: "D1", value: 75 },
      { day: "D2", value: 78 },
      { day: "D3", value: 80 },
      { day: "D4", value: 82 },
      { day: "D5", value: 85 },
      { day: "D6", value: 83 },
      { day: "D7", value: 87 },
    ],
    volume_financeiro: [
      { day: "D1", value: 35000 },
      { day: "D2", value: 42000 },
      { day: "D3", value: 38000 },
      { day: "D4", value: 48000 },
      { day: "D5", value: 45000 },
      { day: "D6", value: 52000 },
      { day: "D7", value: 55000 },
    ],
    consultoria_liquida: [
      { day: "D1", value: 12500 },
      { day: "D2", value: 15200 },
      { day: "D3", value: 13800 },
      { day: "D4", value: 18400 },
      { day: "D5", value: 16900 },
      { day: "D6", value: 21300 },
      { day: "D7", value: 23100 },
    ],
    receita_liquida: [
      { day: "D1", value: 45000 },
      { day: "D2", value: 52000 },
      { day: "D3", value: 48000 },
      { day: "D4", value: 58000 },
      { day: "D5", value: 55000 },
      { day: "D6", value: 62000 },
      { day: "D7", value: 65000 },
    ],
    despesas: [
      { day: "D1", value: 25000 },
      { day: "D2", value: 28000 },
      { day: "D3", value: 26000 },
      { day: "D4", value: 30000 },
      { day: "D5", value: 29000 },
      { day: "D6", value: 32000 },
      { day: "D7", value: 31000 },
    ],
    lucro_liquido: [
      { day: "D1", value: 20000 },
      { day: "D2", value: 24000 },
      { day: "D3", value: 22000 },
      { day: "D4", value: 28000 },
      { day: "D5", value: 26000 },
      { day: "D6", value: 30000 },
      { day: "D7", value: 34000 },
    ],
    meta_mensal: [
      { day: "D1", value: 2000 },
      { day: "D2", value: 2400 },
      { day: "D3", value: 2200 },
      { day: "D4", value: 2800 },
      { day: "D5", value: 2600 },
      { day: "D6", value: 3000 },
      { day: "D7", value: 3400 },
    ],
  };



  // Usar todos os itens sem filtros
  const filteredItems = items;

  const handleApprove = (caseId: number) => {
    approve.mutate(caseId);
  };

  const handleReject = (caseId: number) => {
    reject.mutate(caseId);
  };

  const handleViewDetails = (caseId: number) => {
    router.push(`/casos/${caseId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fechamento</h1>
          <p className="text-muted-foreground">
            Aprovação e revisão de casos prontos para fechamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredItems.length} caso{filteredItems.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtro por mês (KPIs) */}
      <UnifiedFilter
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        label="Filtrar por mês:"
        className="mb-6"
      />

      {/* KPIs do Módulo de Fechamento */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <KPICard
          title="Casos Pendentes"
          value={combinedKpis.casos_pendentes}
          subtitle="Aguardando análise"
          trend={combinedKpis.trends?.casos_pendentes || 0}
          icon={Clock}
          color="warning"
          gradientVariant="amber"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={MOCK_TREND_DATA.casos_pendentes} dataKey="value" xKey="day" stroke="#f59e0b" height={60} />}
        />

        <KPICard
          title="Casos Aprovados"
          value={combinedKpis.casos_aprovados}
          subtitle="Aprovados no período"
          trend={combinedKpis.trends?.casos_aprovados || 0}
          icon={CheckCircle}
          color="success"
          gradientVariant="emerald"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={MOCK_TREND_DATA.casos_aprovados} dataKey="value" xKey="day" stroke="#10b981" height={60} />}
        />

        <KPICard
          title="Taxa de Aprovação"
          value={`${combinedKpis.taxa_aprovacao}%`}
          subtitle="Eficiência do período"
          trend={combinedKpis.trends?.taxa_aprovacao || 0}
          icon={TrendingUp}
          color="primary"
          gradientVariant="violet"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={MOCK_TREND_DATA.taxa_aprovacao} dataKey="value" xKey="day" stroke="#8b5cf6" height={60} />}
        />

        <KPICard
          title="Consultoria Líquida"
          value={combinedKpis.consultoria_liquida ? `R$ ${(combinedKpis.consultoria_liquida / 1000).toFixed(1)}K` : "R$ 0K"}
          subtitle="Casos efetivados pelo financeiro"
          trend={combinedKpis.trends?.consultoria_liquida || 0}
          icon={DollarSign}
          color="warning"
          gradientVariant="amber"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={MOCK_TREND_DATA.consultoria_liquida} dataKey="value" xKey="day" stroke="#f59e0b" height={60} />}
        />

        <KPICard
          title="Meta Mensal"
          value={`R$ ${(combinedKpis.meta_mensal / 1000).toFixed(0)}K`}
          subtitle="(Receita - Despesas) * 10%"
          trend={combinedKpis.trends?.volume_financeiro || 0}
          icon={FileCheck}
          color="success"
          gradientVariant="emerald"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={MOCK_TREND_DATA.volume_financeiro} dataKey="value" xKey="day" stroke="#10b981" height={60} />}
        />
      </div>



      {/* Content */}
      {error ? (
        <div className="text-center py-8">
          <div className="text-destructive mb-2">Erro ao carregar casos</div>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            Nenhum caso pendente para fechamento
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item: any) => (
            <CardFechamento
              key={item.id}
              case={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              onViewDetails={() => router.push(`/fechamento/${item.id}`)}
              isLoading={approve.isPending && approve.variables === item.id || reject.isPending && reject.variables === item.id}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Mostrando {filteredItems.length} de {items.length} casos
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <FechamentoContent />;
}
