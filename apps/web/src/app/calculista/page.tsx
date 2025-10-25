"use client";

export const dynamic = 'force-dynamic';

import { useLiveCaseEvents } from "@/lib/ws";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  CaseSkeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  KPICard,
  MiniAreaChart,
  ProgressBar,
  Pagination,
} from "@lifecalling/ui";
import {
  useAllSimulations,
  useCalculistaStats,
} from "@/lib/simulation-hooks";
import {
  useCalculationKpis,
  useClosingKpis,
  useCasosEfetivados,
  useCasosCancelados,
} from "@/lib/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Calculator,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Target,
  RefreshCw,
  Clock,
  FileText,
  Archive,
  AlertCircle,
  Search,
  X,
  Undo2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

function CalculistaPageContent() {
  useLiveCaseEvents();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados
  const [activeTab, setActiveTab] = useState("todas_simulacoes");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset página quando busca muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Função para atualizar todos os dados
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["calculista-queue"] });
    queryClient.invalidateQueries({ queryKey: ["calculistaSeries"] });
    queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    toast.success("Dados atualizados com sucesso!");
  };



  // Buscar dados de séries temporais reais
  const { data: seriesData } = useQuery({
    queryKey: ["calculistaSeries"],
    queryFn: async () => {
      const response = await api.get("/analytics/series", {
        params: {
          metrics: ["simulacoes_mtd", "aprovadas_mtd", "volume_mtd", "taxa_aprovacao_mtd"],
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
      simulacoes: convertSeriesToMiniChart(seriesData, "simulacoes_mtd"),
      aprovadas: convertSeriesToMiniChart(seriesData, "aprovadas_mtd"),
      volume: convertSeriesToMiniChart(seriesData, "volume_mtd"),
      taxa_aprovacao: convertSeriesToMiniChart(seriesData, "taxa_aprovacao_mtd"),
    };
  }, [seriesData]);

  // Aba inicial via query string
  const searchParams = useSearchParams();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialTab = searchParams.get("tab");
      if (initialTab) setActiveTab(initialTab);
    }
  }, [searchParams]);

  // Resetar página ao trocar de aba
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Dados - busca em tempo real
  // Determinar caseStatus baseado na aba ativa
  // Para "todas_simulacoes", não filtrar por status (buscar TODAS)
  const caseStatusFilter = activeTab === "todas_simulacoes" 
    ? undefined 
    : activeTab === "pendentes" 
      ? "calculista_pendente" 
      : undefined;

  const { data: allSimsData, isLoading: simsLoading } = useAllSimulations(
    activeTab === "todas_simulacoes", // Se true, busca TODAS sem filtro de status
    {
      search: searchTerm || undefined,
      page: currentPage,
      pageSize: pageSize,
      caseStatus: activeTab === "todas_simulacoes" ? undefined : caseStatusFilter
    }
  );
  
  const allSims = allSimsData?.items || [];
  const totalCount = allSimsData?.totalCount || 0;
  const totalPages = allSimsData?.totalPages || 1;
  const { data: stats } = useCalculistaStats();
  // KPIs do mês atual (dados reais)
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Temporariamente desabilitado devido a erro 500
  // const { data: kpis, isLoading: isLoadingKpis } = useCalculationKpis({ month: currentMonth });
  const kpis = null;
  const isLoadingKpis = false;
  const { data: closingKpis, isLoading: isLoadingClosingKpis } = useClosingKpis({ month: currentMonth });

  const { data: casosEfetivados, isLoading: efetivadosLoading } =
    useCasosEfetivados();
  const { data: casosCancelados, isLoading: canceladosLoading } =
    useCasosCancelados();

  // Query para casos encerrados
  const { data: casosEncerrados = [], isLoading: encerradosLoading } = useQuery({
    queryKey: ["/cases", "encerrado"],
    queryFn: async () => {
      const res = await api.get("/cases?status=encerrado&page_size=50");
      return res.data.items || [];
    },
    enabled: activeTab === "encerrados",
  });

  // Query para todas as simulações (para a nova tab)
  const { data: allSimulationsQuery = [], isLoading: allSimulationsLoading } = useQuery({
    queryKey: ["allSimulations"],
    queryFn: async () => {
      const response = await api.get("/simulations", {
        params: { all: true, limit: 100 }
      });
      return response.data || [];
    },
    enabled: activeTab === "todas_simulacoes"
  });

  // KPIs combinados (usando dados do fechamento para meta_mensal e consultoria_liquida)
  const combinedKpis = useMemo(() => {
    // Temporariamente usando stats ao invés de kpis (kpis = null devido a erro 500)
    // if (kpis) {
    //   return {
    //     simulacoes_criadas: kpis.pending || 0,
    //     simulacoes_aprovadas: kpis.approvedToday || 0,
    //     taxa_aprovacao: kpis.approvalRate || 0,
    //     volume_financeiro: kpis.volumeToday || 0,
    //     meta_mensal: closingKpis?.meta_mensal || 0,
    //     consultoria_liquida: closingKpis?.consultoria_liquida || 0,
    //     trends: {
    //       pending: kpis.trends?.pending || 0,
    //       approvedToday: kpis.trends?.approvedToday || 0,
    //       approvalRate: kpis.trends?.approvalRate || 0,
    //       volumeToday: kpis.trends?.volumeToday || 0,
    //       meta_mensal: closingKpis?.trends?.meta_mensal || 0,
    //       consultoria_liquida: closingKpis?.trends?.consultoria_liquida || 0,
    //     },
    //   };
    // }
    return {
      simulacoes_criadas: stats?.pending || 0,
      simulacoes_aprovadas: stats?.approvedToday || 0,
      taxa_aprovacao: stats?.approvalRate || 0,
      volume_financeiro: stats?.volumeToday || 0,
      meta_mensal: closingKpis?.meta_mensal || 0,
      consultoria_liquida: closingKpis?.consultoria_liquida || 0,
      trends: {
        pending: 0,
        approvedToday: 0,
        approvalRate: 0,
        volumeToday: 0,
        meta_mensal: closingKpis?.trends?.meta_mensal || 0,
        consultoria_liquida: closingKpis?.trends?.consultoria_liquida || 0,
      },
    };
  }, [kpis, stats, closingKpis]);

  // Query para contador da tab Retorno Fechamento (sempre ativa)
  const { data: retornoFechamentoCount = 0 } = useQuery({
    queryKey: ["/cases", "fechamento_aprovado_count"],
    queryFn: async () => {
      const res = await api.get(
        "/cases?status=fechamento_aprovado&page_size=1"
      );
      return res.data.total || 0;
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos como backup
  });

  // Casos para outras abas
  const { data: retornoFechamento = [], isLoading: retornoLoading } = useQuery({
    queryKey: ["/cases", "fechamento_aprovado"],
    queryFn: async () => {
      const res = await api.get(
        "/cases?status=fechamento_aprovado&page_size=50"
      );
      return res.data.items || [];
    },
    enabled: activeTab === "retorno_fechamento",
  });

  const { data: enviadosFinanceiro = [], isLoading: enviadosLoading } =
    useQuery({
      queryKey: ["/cases", "financeiro_pendente"],
      queryFn: async () => {
        const res = await api.get(
          "/cases?status=financeiro_pendente&page_size=50"
        );
        return res.data.items || [];
      },
      enabled: activeTab === "enviado_financeiro",
    });

  // Casos devolvidos do financeiro
  const { data: casosDevolvidos = [], isLoading: devolvidosLoading } = useQuery({
    queryKey: ["/cases", "devolvido_financeiro"],
    queryFn: async () => {
      const res = await api.get(
        "/cases?status=devolvido_financeiro&page_size=50"
      );
      return res.data.items || [];
    },
    enabled: activeTab === "devolvidos",
    refetchInterval: 30000,
  });

  // Filtragem (busca já é feita no backend via API)
  const allSimulations = useMemo(() => allSims || [], [allSims]);

  // Separar por status para as abas
  // Para tab Pendentes, o backend já filtra por case.status === "calculista_pendente"
  const pendingSims = activeTab === "pendentes"
    ? allSimulations
    : allSimulations.filter((s: any) => s.status === "draft" && s.case?.status === "calculista_pendente");
  const completedSims = allSimulations.filter(
    (s: any) => s.status === "approved" || s.status === "rejected"
  );

  // Permissões
  useEffect(() => {
    if (user && !["calculista", "supervisor", "admin"].includes(user.role)) {
      router.push("/esteira");
      toast.error("Acesso negado");
    }
  }, [user, router]);



  const handleSimulationClick = (caseId: number) => {
    router.push(`/calculista/${caseId}`);
  };

  if (simsLoading) return <CaseSkeleton />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Calculista
          </h1>
          <p className="text-muted-foreground">Simulações pendentes de análise</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {pendingSims.length} simulações pendentes
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>



      {/* KPIs do módulo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
        <KPICard
          title="Consultoria Líquida"
          value={combinedKpis.consultoria_liquida ? `R$ ${(combinedKpis.consultoria_liquida / 1000).toFixed(1)}K` : "R$ 0K"}
          subtitle="Casos efetivados pelo financeiro"
          trend={combinedKpis.trends?.consultoria_liquida || 0}
          icon={DollarSign}
          color="warning"
          gradientVariant="amber"
          isLoading={(isLoadingKpis || isLoadingClosingKpis) && !stats}
          miniChart={
            <MiniAreaChart
              data={getTrendChartData.volume}
              dataKey="value"
              xKey="day"
              stroke="#f59e0b"
              height={60}
              valueType="currency"
            />
          }
        />

        {/* Card Meta Mensal Customizado */}
        <Card className={`p-6 ${combinedKpis.meta_mensal >= 0 ? 'border-success bg-success/5' : 'border-danger bg-danger/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${combinedKpis.meta_mensal >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                <Target className={`h-5 w-5 ${combinedKpis.meta_mensal >= 0 ? 'text-success' : 'text-danger'}`} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Meta Mensal</h3>
                <p className={`text-2xl font-bold ${combinedKpis.meta_mensal >= 0 ? 'text-success' : 'text-danger'}`}>
                  R$ {combinedKpis.meta_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm ${
                (combinedKpis.trends?.meta_mensal ?? 0) >= 0 ? 'text-success' : 'text-danger'
              }`}>
                <TrendingUp className="h-4 w-4" />
                {Math.abs(combinedKpis.trends?.meta_mensal ?? 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">vs. mês anterior</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso da Meta</span>
              <span className="font-medium">
                {combinedKpis.meta_mensal >= 0 && combinedKpis.consultoria_liquida > 0
                  ? Math.round((combinedKpis.meta_mensal / (combinedKpis.consultoria_liquida * 0.1)) * 100)
                  : 0}%
              </span>
            </div>
            <ProgressBar
              value={combinedKpis.meta_mensal >= 0 ? combinedKpis.meta_mensal : 0}
              max={combinedKpis.consultoria_liquida * 0.1}
              variant={combinedKpis.meta_mensal >= 0 ? "success" : "danger"}
              size="sm"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Atual: {combinedKpis.meta_mensal >= 0 ? 'R$ ' : '-R$ '}{Math.abs(combinedKpis.meta_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Meta: R$ {(combinedKpis.consultoria_liquida * 0.1).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Campo de Busca */}
      <div className="space-y-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por CPF ou nome do cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border border-input bg-muted text-foreground placeholder:text-muted-foreground"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {totalCount} simulação{totalCount !== 1 ? 'ões' : ''}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="todas_simulacoes">
            Todas Simulações
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({pendingSims.length})
          </TabsTrigger>
          <TabsTrigger value="retorno_fechamento">
            Retorno Fechamento ({retornoFechamentoCount})
          </TabsTrigger>
          <TabsTrigger value="devolvidos">
            Devolvidos ({casosDevolvidos.length})
          </TabsTrigger>
          <TabsTrigger value="enviado_financeiro">
            Enviado Financeiro ({enviadosFinanceiro.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas Hoje ({completedSims.length})
          </TabsTrigger>
          <TabsTrigger value="efetivados">
            Casos Efetivados ({casosEfetivados?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="encerrados">
            Encerrados ({casosEncerrados?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="cancelados">
            Casos Cancelados ({casosCancelados?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Pendentes */}
        <TabsContent value="pendentes" className="mt-6">
          {pendingSims.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhuma simulação pendente
              </h3>
              <p className="text-sm text-muted-foreground">
                Todas as simulações foram processadas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSims.map((sim: any) => (
                <Card
                  key={sim.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSimulationClick(sim.case_id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Caso #{sim.case_id}</Badge>
                      <StatusBadge status={sim.case?.status || "calculista_pendente"} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">Simulação Multi-Bancos</h3>
                      <p className="text-sm text-muted-foreground">
                        {sim.client?.name || "Cliente não identificado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aguardando análise do calculista
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Criado em:{" "}
                      {new Date(
                        sim.created_at || Date.now()
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Retorno Fechamento */}
        <TabsContent value="retorno_fechamento" className="mt-6">
          {retornoLoading ? (
            <CaseSkeleton />
          ) : retornoFechamento.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhum caso de retorno de fechamento
              </h3>
              <p className="text-sm text-muted-foreground">
                Casos aprovados pelo fechamento aparecerão aqui para revisão final.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {retornoFechamento.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-emerald-200"
                  onClick={() => router.push(`/calculista/${caso.id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Caso #{caso.id}</Badge>
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">
                        {caso.client?.name || "Cliente não identificado"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {caso.client?.cpf || "---"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Revisão final antes de enviar para financeiro
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em:{" "}
                      {new Date(
                        caso.last_update_at || Date.now()
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Revisar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Devolvidos do Financeiro */}
        <TabsContent value="devolvidos" className="mt-6">
          {devolvidosLoading ? (
            <CaseSkeleton />
          ) : casosDevolvidos.length === 0 ? (
            <div className="text-center py-12">
              <Undo2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhum caso devolvido
              </h3>
              <p className="text-sm text-muted-foreground">
                Casos devolvidos pelo financeiro para recálculo aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {casosDevolvidos.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 hover:scale-[1.02]"
                  onClick={() => router.push(`/calculista/${caso.id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-2 border-orange-400 text-orange-700 bg-orange-50 font-semibold">Caso #{caso.id}</Badge>
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {caso.client?.name || "Cliente não identificado"}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        CPF: {caso.client?.cpf || "---"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 p-2 bg-orange-100 border border-orange-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <p className="text-sm text-orange-800 font-medium">
                          Devolvido para recálculo pelo financeiro
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg border">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Devolvido em:{" "}
                      {new Date(
                        caso.last_update_at || Date.now()
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-2 border-orange-400 text-orange-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md" 
                        size="sm"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Recalcular
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Enviado Financeiro */}
        <TabsContent value="enviado_financeiro" className="mt-6">
          {enviadosLoading ? (
            <CaseSkeleton />
          ) : enviadosFinanceiro.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhum caso aguardando financeiro
              </h3>
              <p className="text-sm text-muted-foreground">
                Após aprovação de retorno, casos aparecerão aqui até liberação.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enviadosFinanceiro.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-4 hover:shadow-md transition-shadow border-blue-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Caso #{caso.id}</Badge>
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">
                        {caso.client?.name || "Cliente não identificado"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {caso.client?.cpf || "---"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aprovado pelo calculista. Em processamento no financeiro.
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em:{" "}
                      {new Date(
                        caso.last_update_at || Date.now()
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm" disabled>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Aguardando Financeiro
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Concluídas */}
        <TabsContent value="concluidas" className="mt-6">
          {completedSims.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhuma simulação concluída hoje
              </h3>
              <p className="text-sm text-muted-foreground">
                As simulações aprovadas/rejeitadas hoje aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedSims.map((sim: any) => (
                <Card
                  key={sim.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSimulationClick(sim.case_id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Caso #{sim.case_id}</Badge>
                      <StatusBadge
                        status={sim.case?.status || (sim.status === "approved" ? "calculo_aprovado" : "calculo_rejeitado")}
                        size="sm"
                      />
                    </div>

                    <div>
                      <h3 className="font-medium">Simulação Multi-Bancos</h3>
                      <p className="text-sm text-muted-foreground">
                        {sim.client?.name || "Cliente não identificado"}
                      </p>
                      {sim.totals?.liberadoCliente && (
                        <p className="text-xs font-semibold text-green-600">
                          R${" "}
                          {sim.totals.liberadoCliente.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em:{" "}
                      {new Date(
                        sim.updated_at || sim.created_at
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      <Calculator className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Todas Simulações */}
        <TabsContent value="todas_simulacoes" className="mt-6">
          <div className="space-y-4">
            {/* Lista de todas as simulações */}
            {allSims.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium text-muted-foreground mb-1">
                  Nenhuma simulação encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Tente ajustar os termos de busca." : "Não há simulações registradas."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allSims.map((sim: any) => (
                    <Card
                      key={sim?.id || Math.random()}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSimulationClick(sim?.case_id || 0)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={sim?.case?.status || sim?.status || 'draft'} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {sim?.updated_at || sim?.created_at
                              ? new Date(sim.updated_at || sim.created_at).toLocaleDateString("pt-BR")
                              : 'Data não disponível'
                            }
                          </span>
                        </div>

                        <div>
                          <h3 className="font-medium">Caso #{sim?.case_id || '---'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {sim?.client?.name || "Cliente não identificado"}
                          </p>
                          {sim?.client?.cpf && (
                            <p className="text-xs text-muted-foreground">
                              CPF: {sim.client.cpf}
                            </p>
                          )}
                        </div>

                        {/* Informações adicionais da simulação */}
                        {(sim?.prazo || sim?.banks_json) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {sim.prazo && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Prazo:</span>
                                <span>{sim.prazo} meses</span>
                              </div>
                            )}
                            {sim.banks_json && Array.isArray(sim.banks_json) && sim.banks_json.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Bancos:</span>
                                <span>{sim.banks_json.length}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {sim?.observacao_calculista && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <strong>Obs:</strong> {sim.observacao_calculista}
                            </div>
                          )}
                        </div>

                        <Button variant="outline" className="w-full" size="sm">
                          <Calculator className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </Card>
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
          </div>
        </TabsContent>

        {/* Efetivados */}
        <TabsContent value="efetivados" className="mt-6">
          {efetivadosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CaseSkeleton key={i} />
              ))}
            </div>
          ) : casosEfetivados?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum caso efetivado encontrado
              </h3>
              <p className="text-muted-foreground">
                Não há casos efetivados no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosEfetivados?.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">Caso #{caso.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caso.client?.name || "Cliente não identificado"}
                      </p>
                      {caso.client?.cpf && (
                        <p className="text-xs text-muted-foreground">
                          CPF: {caso.client.cpf}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Efetivado em:{" "}
                      {new Date(
                        caso.updated_at || caso.created_at
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Encerrados */}
        <TabsContent value="encerrados" className="mt-6">
          {encerradosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CaseSkeleton key={i} />
              ))}
            </div>
          ) : casosEncerrados?.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum caso encerrado encontrado
              </h3>
              <p className="text-muted-foreground">
                Não há casos encerrados no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosEncerrados?.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">Caso #{caso.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caso.client?.name || "Cliente não identificado"}
                      </p>
                      {caso.client?.cpf && (
                        <p className="text-xs text-muted-foreground">
                          CPF: {caso.client.cpf}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Encerrado em:{" "}
                      {new Date(
                        caso.updated_at || caso.created_at
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cancelados */}
        <TabsContent value="cancelados" className="mt-6">
          {canceladosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CaseSkeleton key={i} />
              ))}
            </div>
          ) : casosCancelados?.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum caso cancelado encontrado
              </h3>
              <p className="text-muted-foreground">
                Não há casos cancelados no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosCancelados?.map((caso: any) => (
                <Card
                  key={caso.id}
                  className="p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={caso.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="font-medium">Caso #{caso.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caso.client?.name || "Cliente não identificado"}
                      </p>
                      {caso.client?.cpf && (
                        <p className="text-xs text-muted-foreground">
                          CPF: {caso.client.cpf}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Cancelado em:{" "}
                      {new Date(
                        caso.updated_at || caso.created_at
                      ).toLocaleDateString("pt-BR")}
                    </div>

                    <Button variant="outline" className="w-full" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CalculistaPage() {
  return (
    <Suspense fallback={<CaseSkeleton />}>
      <CalculistaPageContent />
    </Suspense>
  );
}
