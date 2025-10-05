"use client";

import { useLiveCaseEvents } from "@/lib/ws";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
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
  UnifiedFilter,
  KPICard,
  MiniAreaChart,
} from "@lifecalling/ui";
import {
  useAllSimulations,
  useCalculistaStats,
} from "@/lib/simulation-hooks";
import {
  useCalculationKpis,
  useCasosEfetivados,
  useCasosCancelados,
} from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Calculator,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function CalculistaPage() {
  useLiveCaseEvents();
  const router = useRouter();
  const { user } = useAuth();

  // Estados
  const [activeTab, setActiveTab] = useState("pendentes");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // -----------------------------
  // Mock para mini gráficos (KPIs)
  // -----------------------------
  const MOCK_TREND_DATA = {
    simulacoes: [
      { day: "D1", value: 15 },
      { day: "D2", value: 22 },
      { day: "D3", value: 18 },
      { day: "D4", value: 28 },
      { day: "D5", value: 25 },
      { day: "D6", value: 32 },
      { day: "D7", value: 35 },
    ],
    aprovadas: [
      { day: "D1", value: 12 },
      { day: "D2", value: 18 },
      { day: "D3", value: 15 },
      { day: "D4", value: 24 },
      { day: "D5", value: 21 },
      { day: "D6", value: 28 },
      { day: "D7", value: 30 },
    ],
    volume: [
      { day: "D1", value: 45000 },
      { day: "D2", value: 52000 },
      { day: "D3", value: 48000 },
      { day: "D4", value: 65000 },
      { day: "D5", value: 58000 },
      { day: "D6", value: 72000 },
      { day: "D7", value: 78000 },
    ],
    taxa_aprovacao: [
      { day: "D1", value: 80 },
      { day: "D2", value: 82 },
      { day: "D3", value: 83 },
      { day: "D4", value: 86 },
      { day: "D5", value: 84 },
      { day: "D6", value: 88 },
      { day: "D7", value: 86 },
    ],
  };

  // Aba inicial via query string
  const searchParams = useSearchParams();
  useEffect(() => {
    const initialTab = searchParams.get("tab");
    if (initialTab) setActiveTab(initialTab);
  }, [searchParams]);

  // Dados
  const { data: allSims, isLoading: simsLoading } = useAllSimulations(true);
  const { data: stats } = useCalculistaStats();
  // KPIs do mês selecionado (dados reais)
  const { data: kpis, isLoading: isLoadingKpis } = useCalculationKpis({ month: selectedMonth });

  const { data: casosEfetivados, isLoading: efetivadosLoading } =
    useCasosEfetivados();
  const { data: casosCancelados, isLoading: canceladosLoading } =
    useCasosCancelados();

  // KPIs combinados (fallback para stats locais)
  const combinedKpis = useMemo(() => {
    if (kpis) {
      return {
        simulacoes_criadas: kpis.pending || 0,
        simulacoes_aprovadas: kpis.approvedToday || 0,
        taxa_aprovacao: kpis.approvalRate || 0,
        volume_financeiro: kpis.volumeToday || 0,
        meta_mensal: kpis.meta_mensal || 50000,
        trends: kpis.trends || {
          pending: 0,
          approvedToday: 0,
          approvalRate: 0,
          volumeToday: 0,
          meta_mensal: 0,
        },
      };
    }
    return {
      simulacoes_criadas: stats?.pending || 0,
      simulacoes_aprovadas: stats?.approvedToday || 0,
      taxa_aprovacao: stats?.approvalRate || 0,
      volume_financeiro: stats?.volumeToday || 0,
      meta_mensal: 50000,
      trends: {
        pending: 0,
        approvedToday: 0,
        approvalRate: 0,
        volumeToday: 0,
        meta_mensal: 0,
      },
    };
  }, [kpis, stats]);

  // Casos para outras abas
  const { data: retornoFechamento = [], isLoading: retornoLoading } = useQuery({
    queryKey: ["/cases", "retorno_fechamento_and_fechamento_aprovado"],
    queryFn: async () => {
      const res = await api.get(
        "/cases?status=retorno_fechamento,fechamento_aprovado&page_size=50"
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

  // Filtragem
  const allSimulations = allSims || [];

  // Separar por status para as abas
  const pendingSims = allSimulations.filter((s: any) => s.status === "draft");
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
        <Badge variant="secondary">
          {pendingSims.length} simulações pendentes
        </Badge>
      </div>

      {/* Filtro por mês (apenas visual - KPIs) */}
      <UnifiedFilter
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        label="Filtrar por mês:"
        className="mb-6"
      />

      {/* KPIs do módulo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <KPICard
          title="Simulações Criadas"
          value={combinedKpis.simulacoes_criadas}
          subtitle="Total no período"
          trend={combinedKpis.trends?.pending ?? 0}
          icon={Calculator}
          color="info"
          gradientVariant="sky"
          isLoading={isLoadingKpis && !stats}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.simulacoes}
              dataKey="value"
              xKey="day"
              stroke="#0ea5e9"
              height={60}
            />
          }
        />

        <KPICard
          title="Simulações Aprovadas"
          value={combinedKpis.simulacoes_aprovadas}
          subtitle="Aprovadas no período"
          trend={combinedKpis.trends?.approvedToday ?? 0}
          icon={CheckCircle}
          color="success"
          gradientVariant="emerald"
          isLoading={isLoadingKpis && !stats}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.aprovadas}
              dataKey="value"
              xKey="day"
              stroke="#10b981"
              height={60}
            />
          }
        />

        <KPICard
          title="Taxa de Aprovação"
          value={`${combinedKpis.taxa_aprovacao}%`}
          subtitle="Eficiência do período"
          trend={combinedKpis.trends?.approvalRate ?? 0}
          icon={TrendingUp}
          color="primary"
          gradientVariant="violet"
          isLoading={isLoadingKpis && !stats}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.taxa_aprovacao}
              dataKey="value"
              xKey="day"
              stroke="#8b5cf6"
              height={60}
            />
          }
        />

        <KPICard
          title="Volume Financeiro"
          value={`R$ ${(combinedKpis.volume_financeiro / 1000).toFixed(0)}K`}
          subtitle="Volume aprovado"
          trend={combinedKpis.trends?.volumeToday ?? 0}
          icon={DollarSign}
          color="warning"
          gradientVariant="amber"
          isLoading={isLoadingKpis && !stats}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.volume}
              dataKey="value"
              xKey="day"
              stroke="#f59e0b"
              height={60}
            />
          }
        />

        <KPICard
          title="Meta Mensal"
          value={`R$ ${(combinedKpis.meta_mensal / 1000).toFixed(0)}K`}
          subtitle="10% da receita líquida"
          trend={combinedKpis.trends?.meta_mensal ?? 0}
          icon={Target}
          color="success"
          gradientVariant="emerald"
          isLoading={isLoadingKpis && !kpis}
        />
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes ({pendingSims.length})
          </TabsTrigger>
          <TabsTrigger value="retorno_fechamento">
            Retorno Fechamento ({retornoFechamento.length})
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
                      <StatusBadge status="draft" size="sm" />
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
                      <StatusBadge status="fechamento_aprovado" size="sm" />
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
                      <StatusBadge status="financeiro_pendente" size="sm" />
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
                        status={sim.status === "approved" ? "aprovado" : "reprovado"}
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
                      <StatusBadge status="contrato_efetivado" size="sm" />
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
                      <StatusBadge status="encerrado" size="sm" />
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
