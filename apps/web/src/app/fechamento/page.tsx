"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useClosingQueue, useClosingApprove, useClosingReject, useClosingKpis, useCasosEfetivados } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Button,
  Badge,
  CardFechamento,
  KPICard,
  MiniAreaChart,
  ProgressBar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@lifecalling/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, User, Calendar, DollarSign, Building, X, CheckCircle, Clock, TrendingUp, Target, FileCheck, Eye } from "lucide-react";

function FechamentoContent() {
  useLiveCaseEvents();
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useClosingQueue();
  const approve = useClosingApprove();
  const reject = useClosingReject();
  const { data: efetivadosCases = [], isLoading: isLoadingEfetivados } = useCasosEfetivados();

  // Estado para controle da tab ativa
  const [activeTab, setActiveTab] = useState("pendentes");





  // Hook para buscar dados de KPI do fechamento do mês atual
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const { data: kpis, isLoading: isLoadingKpis } = useClosingKpis({ month: currentMonth });

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

  // Buscar dados de séries temporais reais
  const { data: seriesData } = useQuery({
    queryKey: ["fechamentoSeries"],
    queryFn: async () => {
      const response = await api.get("/analytics/series", {
        params: {
          metrics: [
            "casos_pendentes_mtd", "casos_aprovados_mtd", "taxa_aprovacao_mtd",
            "volume_financeiro_mtd", "consultoria_liq_mtd", "receita_liquida_mtd",
            "despesas_mtd", "lucro_liquido_mtd", "meta_mensal_mtd"
          ],
          period: "7d"
        }
      });
      return response.data;
    },
    retry: 2,
  });

  // Função para converter dados de série em formato de mini-chart
  const convertSeriesToMiniChart = (seriesData: any, metricKey: string) => {
    if (!seriesData?.series?.[metricKey]) {
      return [];
    }

    return seriesData.series[metricKey].map((point: any, index: number) => ({
      day: `D${index + 1}`,
      value: point.value || 0
    }));
  };

  // Gerar dados de tendência reais para mini-charts
  const getTrendChartData = useMemo(() => {
    return {
      casos_pendentes: convertSeriesToMiniChart(seriesData, "casos_pendentes_mtd"),
      casos_aprovados: convertSeriesToMiniChart(seriesData, "casos_aprovados_mtd"),
      taxa_aprovacao: convertSeriesToMiniChart(seriesData, "taxa_aprovacao_mtd"),
      volume_financeiro: convertSeriesToMiniChart(seriesData, "volume_financeiro_mtd"),
      consultoria_liquida: convertSeriesToMiniChart(seriesData, "consultoria_liq_mtd"),
      receita_liquida: convertSeriesToMiniChart(seriesData, "receita_liquida_mtd"),
      despesas: convertSeriesToMiniChart(seriesData, "despesas_mtd"),
      lucro_liquido: convertSeriesToMiniChart(seriesData, "lucro_liquido_mtd"),
      meta_mensal: convertSeriesToMiniChart(seriesData, "meta_mensal_mtd"),
    };
  }, [seriesData]);



  // Separar casos por status
  const casosPendentes = useMemo(() => {
    return items.filter((item: any) =>
      item.status === 'calculo_aprovado' || item.status === 'fechamento_pendente'
    );
  }, [items]);

  const casosAprovados = useMemo(() => {
    return items.filter((item: any) =>
      item.status === 'fechamento_aprovado'
    );
  }, [items]);

  const casosRejeitados = useMemo(() => {
    return items.filter((item: any) =>
      item.status === 'fechamento_reprovado'
    );
  }, [items]);

  // Casos a serem exibidos baseado na tab ativa
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "pendentes":
        return casosPendentes;
      case "aprovados":
        return casosAprovados;
      case "rejeitados":
        return casosRejeitados;
      default:
        return casosPendentes;
    }
  }, [activeTab, casosPendentes, casosAprovados, casosRejeitados]);



  const handleApprove = (caseId: number) => {
    approve.mutate(caseId, {
      onSuccess: () => {
        // Após aprovação, manter na tab pendentes para ver a atualização
        refetch();
      }
    });
  };

  const handleReject = (caseId: number) => {
    reject.mutate(caseId, {
      onSuccess: () => {
        refetch();
      }
    });
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



      {/* KPIs do Módulo de Fechamento */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <KPICard
          title="Casos Pendentes"
          value={combinedKpis.casos_pendentes}
          subtitle="Aguardando análise"
          trend={combinedKpis.trends?.casos_pendentes || 0}
          icon={Clock}
          color="warning"
          gradientVariant="amber"
          isLoading={isLoadingKpis && !kpis}
          miniChart={<MiniAreaChart data={getTrendChartData.casos_pendentes} dataKey="value" xKey="day" stroke="#f59e0b" height={60} />}
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
          miniChart={<MiniAreaChart data={getTrendChartData.consultoria_liquida} dataKey="value" xKey="day" stroke="#8b5cf6" height={60} valueType="currency" />}
        />

        {/* Meta Mensal Card - Custom with Progress Bar */}
        <div className={`rounded-lg border p-6 transition-all duration-200 hover:shadow-md ${
          combinedKpis.meta_mensal >= 0
            ? 'border-success/40 bg-success-subtle hover:border-success/60'
            : 'border-danger/40 bg-danger-subtle hover:border-danger/60'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className={`h-5 w-5 ${
                    combinedKpis.meta_mensal >= 0 ? 'text-success' : 'text-danger'
                  }`} />
                  <h3 className={`text-sm font-medium ${
                    combinedKpis.meta_mensal >= 0 ? 'text-success-foreground' : 'text-danger-foreground'
                  }`}>
                    Meta Mensal
                  </h3>
                </div>
                <div className={`text-2xl font-bold ${
                  combinedKpis.meta_mensal >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {combinedKpis.meta_mensal >= 0 ? 'R$ ' : '-R$ '}{Math.abs(combinedKpis.meta_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  10% de (consultoria líquida - despesas)
                </p>
              </div>

              <div className="flex items-center gap-1">
                {(combinedKpis.trends?.meta_mensal || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-danger rotate-180" />
                )}
                <span className={`text-xs ${
                  (combinedKpis.trends?.meta_mensal || 0) >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {Math.abs(combinedKpis.trends?.meta_mensal || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso da Meta</span>
                <span className={`font-medium ${
                  combinedKpis.meta_mensal >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {combinedKpis.meta_mensal >= 0 && combinedKpis.consultoria_liquida > 0
                    ? Math.round((combinedKpis.meta_mensal / (combinedKpis.consultoria_liquida * 0.1)) * 100)
                    : 0}%
                </span>
              </div>
              <ProgressBar
                value={combinedKpis.meta_mensal >= 0 ? combinedKpis.meta_mensal : 0}
                max={combinedKpis.consultoria_liquida * 0.1}
                variant={
                  combinedKpis.meta_mensal >= 0
                    ? combinedKpis.meta_mensal >= (combinedKpis.consultoria_liquida * 0.1) * 0.8
                      ? "success"
                      : combinedKpis.meta_mensal >= (combinedKpis.consultoria_liquida * 0.1) * 0.5
                        ? "warning"
                        : "danger"
                    : "danger"
                }
                size="md"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={combinedKpis.meta_mensal >= 0 ? 'text-success/80' : 'text-danger/80'}>
                  Atual: {combinedKpis.meta_mensal >= 0 ? 'R$ ' : '-R$ '}{Math.abs(combinedKpis.meta_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span>Meta: R$ {(combinedKpis.consultoria_liquida * 0.1).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Tabs para casos por status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendentes">
            Casos Pendentes ({casosPendentes.length})
          </TabsTrigger>
          <TabsTrigger value="aprovados">
            Casos Aprovados ({casosAprovados.length})
          </TabsTrigger>
          <TabsTrigger value="rejeitados">
            Casos Rejeitados ({casosRejeitados.length})
          </TabsTrigger>
          <TabsTrigger value="efetivados">
            Casos Efetivados pelo Financeiro ({efetivadosCases.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Casos Pendentes */}
        <TabsContent value="pendentes" className="mt-6">
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
          ) : casosPendentes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                Nenhum caso pendente para fechamento
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {casosPendentes.map((item: any) => (
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
        </TabsContent>

        {/* Tab Casos Aprovados */}
        <TabsContent value="aprovados" className="mt-6">
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
          ) : casosAprovados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                Nenhum caso aprovado ainda
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {casosAprovados.map((item: any) => (
                <CardFechamento
                  key={item.id}
                  case={item}
                  onApprove={() => handleApprove(item.id)}
                  onReject={() => handleReject(item.id)}
                  onViewDetails={() => router.push(`/fechamento/${item.id}`)}
                  isLoading={approve.isPending && approve.variables === item.id || reject.isPending && reject.variables === item.id}
                  hideActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Casos Rejeitados */}
        <TabsContent value="rejeitados" className="mt-6">
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
          ) : casosRejeitados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                Nenhum caso rejeitado ainda
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {casosRejeitados.map((item: any) => (
                <CardFechamento
                  key={item.id}
                  case={item}
                  onApprove={() => handleApprove(item.id)}
                  onReject={() => handleReject(item.id)}
                  onViewDetails={() => router.push(`/fechamento/${item.id}`)}
                  isLoading={approve.isPending && approve.variables === item.id || reject.isPending && reject.variables === item.id}
                  // hideActions prop removed – CardFechamento no longer accepts it
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Casos Efetivados pelo Financeiro */}
        <TabsContent value="efetivados" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Casos Efetivados pelo Financeiro</h2>
            <div className="text-sm text-muted-foreground">
              {efetivadosCases.length} caso(s) efetivado(s)
            </div>
          </div>

          {isLoadingEfetivados ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : efetivadosCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <h3 className="text-lg font-medium">Nenhum caso efetivado</h3>
                <p className="text-muted-foreground">
                  Não há casos efetivados pelo financeiro no momento.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {efetivadosCases.map((caso: any) => (
                <div key={caso.id} className="p-4 space-y-3 hover:shadow-md transition-shadow border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Efetivado
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        #{caso.id}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium">{caso.client?.name || "Cliente não identificado"}</h3>
                      {caso.client?.cpf && (
                        <p className="text-sm text-muted-foreground">
                          CPF: {caso.client.cpf}
                        </p>
                      )}
                      {caso.client?.matricula && (
                        <p className="text-xs text-muted-foreground">
                          Matrícula: {caso.client.matricula}
                        </p>
                      )}
                    </div>

                    {caso.banco && (
                      <div className="text-sm">
                        <span className="font-medium">Banco:</span> {caso.banco}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Efetivado em: {new Date(caso.updated_at || caso.created_at).toLocaleDateString("pt-BR")}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/fechamento/${caso.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Page() {
  return <FechamentoContent />;
}
