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
  TabsContent,
  Pagination,
  DateRangeFilter
} from "@lifecalling/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, User, Calendar, DollarSign, Building, X, CheckCircle, Clock, TrendingUp, TrendingDown, Target, FileCheck, Eye, Search } from "lucide-react";

function FechamentoContent() {
  useLiveCaseEvents();
  const router = useRouter();
  
  // Estados para busca e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState("pendentes");

  // Estados para filtro de período
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  });

  // Hook para buscar dados com filtros
  const { data: queueData, isLoading, error, refetch } = useClosingQueue({
    search: searchTerm || undefined,
    page: currentPage,
    pageSize: pageSize
  });

  const approve = useClosingApprove();
  const reject = useClosingReject();
  const { data: efetivadosCases = [], isLoading: isLoadingEfetivados } = useCasosEfetivados();

  // Extrair dados da resposta
  const items = queueData?.items || [];
  const totalCount = queueData?.totalCount || 0;
  const totalPages = queueData?.totalPages || 1;





  // Hook para buscar dados de KPI do fechamento do período selecionado
  const { data: kpis, isLoading: isLoadingKpis } = useClosingKpis({ from: startDate, to: endDate });

  // Query para métricas financeiras (mesmo endpoint do Financeiro)
  const { data: financeMetrics, isLoading: financeMetricsLoading } = useQuery({
    queryKey: ["financeMetrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });

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
    // Apenas casos com status "fechamento_pendente" (Aguardando Fechamento)
    return items.filter((item: any) => item.status === 'fechamento_pendente');
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
        // Após aprovação, resetar para primeira página e recarregar
        setCurrentPage(1);
        refetch();
      }
    });
  };

  const handleReject = (caseId: number) => {
    reject.mutate(caseId, {
      onSuccess: () => {
        // Após rejeição, resetar para primeira página e recarregar
        setCurrentPage(1);
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
            {totalCount} caso{totalCount !== 1 ? 's' : ''}
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

      {/* Filtro de Período */}
      <div className="flex flex-col gap-4">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            if (start && end) {
              const s = new Date(start);
              const e = new Date(end);
              if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                setStartDate(start);
                setEndDate(end);
              }
            }
          }}
          onClear={() => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split("T")[0]);
            setEndDate(lastDay.toISOString().split("T")[0]);
          }}
          label="Filtrar período:"
          className="mb-4"
        />
      </div>

      {/* KPIs do Módulo de Fechamento */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <KPICard
          title="Casos Pendentes"
          value={casosPendentes.length}
          subtitle="Aguardando fechamento"
          trend={0}
          icon={Clock}
          color="warning"
          gradientVariant="amber"
          isLoading={isLoading}
          miniChart={<MiniAreaChart data={getTrendChartData.casos_pendentes} dataKey="value" xKey="day" stroke="#f59e0b" height={60} />}
        />

        {/* Card Consultoria Líquida */}
        <KPICard
          title="Consultoria Líquida Total"
          subtitle="86% da Receita Total"
          value={`R$ ${(financeMetrics?.totalConsultoriaLiq || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          isLoading={financeMetricsLoading}
          gradientVariant="cyan"
          trend={combinedKpis.trends?.consultoria_liquida || 0}
        />

        {/* Card Resultado Francisco */}
        <KPICard
          title="Resultado Francisco"
          subtitle="10% × (Lucro Líquido - Receitas Peltson)"
          value={`${(combinedKpis.meta_mensal || 0) >= 0 ? 'R$ ' : '-R$ '}${Math.abs(combinedKpis.meta_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          isLoading={isLoadingKpis}
          gradientVariant={(combinedKpis.meta_mensal || 0) >= 0 ? "emerald" : "rose"}
          icon={(combinedKpis.meta_mensal || 0) >= 0 ? TrendingUp : TrendingDown}
          trend={combinedKpis.trends?.meta_mensal || 0}
          className={(combinedKpis.meta_mensal || 0) >= 0
            ? "border-2 border-emerald-500/60 shadow-emerald-500/20"
            : "border-2 border-rose-500/60 shadow-rose-500/20"
          }
        />
      </div>



      {/* Busca */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} caso{totalCount !== 1 ? 's' : ''}
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
            <>
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
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    itemsPerPageOptions={[20, 50, 100]}
                  />
                </div>
              )}
            </>
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
            <>
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
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    itemsPerPageOptions={[20, 50, 100]}
                  />
                </div>
              )}
            </>
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
            <>
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
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    itemsPerPageOptions={[20, 50, 100]}
                  />
                </div>
              )}
            </>
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
