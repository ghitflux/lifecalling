"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Badge,
  CaseSkeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  QuickFilters
} from "@lifecalling/ui";
import {
  useAllSimulations,
  useCalculistaStats
} from "@/lib/simulation-hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Calculator, CheckCircle, XCircle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function CalculistaPage(){
  useLiveCaseEvents();
  const router = useRouter();
  const { user } = useAuth();

  // Estados
  const [activeTab, setActiveTab] = useState("pendentes");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Ler aba inicial via query string (?tab=...)
  const searchParams = useSearchParams();
  useEffect(() => {
    const initialTab = searchParams.get("tab");
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [searchParams]);

  // Buscar simulações com suporte a concluídas (sempre carregar todas para contadores corretos)
  const { data: allSims, isLoading: simsLoading } = useAllSimulations(true);
  const { data: stats } = useCalculistaStats();

  // Buscar casos com status relevantes para Retorno de Fechamento
  const { data: retornoFechamento = [], isLoading: retornoLoading } = useQuery({
    queryKey: ["/cases", "retorno_fechamento_and_fechamento_aprovado"],
    queryFn: async () => {
      const response = await api.get("/cases?status=retorno_fechamento,fechamento_aprovado&page_size=50");
      return response.data.items || [];
    },
    enabled: activeTab === "retorno_fechamento"
  });

  // Buscar casos enviados ao financeiro
  const { data: enviadosFinanceiro = [], isLoading: enviadosLoading } = useQuery({
    queryKey: ["/cases", "financeiro_pendente"],
    queryFn: async () => {
      const response = await api.get("/cases?status=financeiro_pendente&page_size=50");
      return response.data.items || [];
    },
    enabled: activeTab === "enviado_financeiro"
  });

  // Query removida: detalhes do caso não são exibidos por modal nesta página

  // Filtrar simulações
  const allSimulations = allSims || [];

  const statusCounts = {
    draft: allSimulations.filter((sim: any) => sim.status === "draft").length,
    approved: allSimulations.filter((sim: any) => sim.status === "approved").length,
    rejected: allSimulations.filter((sim: any) => sim.status === "rejected").length,
    devolvido_financeiro: allSimulations.filter((sim: any) => sim.status === "devolvido_financeiro").length,
    fechamento_aprovado: allSimulations.filter((sim: any) => sim.status === "fechamento_aprovado").length
  };

  const filteredSims = allSimulations.filter((sim: any) => {
    // Filtro por status (string)
    if (statusFilter !== "all" && sim.status !== statusFilter) {
      return false;
    }

    // Filtro por busca (nome do cliente ou CPF)
    if (searchTerm) {
      const clientName = sim.client?.name?.toLowerCase() || "";
      const clientCpf = sim.client?.cpf || "";
      const search = searchTerm.toLowerCase();
      return clientName.includes(search) || clientCpf.includes(search);
    }

    return true;
  });

  // Separar simulações por status (para contadores das abas, usar dados originais)
  const allPendingSims = allSimulations.filter((s: any) => s.status === "draft");
  const allCompletedSims = allSimulations.filter((s: any) => s.status === "approved" || s.status === "rejected");
  
  // Separar simulações filtradas para exibição
  const pendingSims = filteredSims.filter((s: any) => s.status === "draft");
  const completedSims = filteredSims.filter((s: any) => s.status === "approved" || s.status === "rejected");

  // Verificar permissões
  useEffect(() => {
    if (user && !["calculista", "supervisor", "admin"].includes(user.role)) {
      router.push("/esteira");
      toast.error("Acesso negado");
    }
  }, [user, router]);

  // Função para navegar para simulação específica
  const handleSimulationClick = (caseId: number) => {
    router.push(`/calculista/${caseId}`);
  };

  // Função removida: visualização por modal foi desabilitada

  // Loading state
  if (simsLoading) {
    return <CaseSkeleton />;
  }

  // Lista principal de simulações
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Calculista
          </h1>
          <p className="text-muted-foreground">
            Simulações pendentes de análise
          </p>
        </div>
        <Badge variant="secondary">
          {pendingSims.length} simulações pendentes
        </Badge>
      </div>

      {/* KPIs Avançados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprovadas Hoje</p>
              <p className="text-2xl font-bold">{stats?.approvedToday || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-md">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejeitadas Hoje</p>
              <p className="text-2xl font-bold">{stats?.rejectedToday || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hoje</p>
              <p className="text-2xl font-bold">{stats?.totalToday || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-md">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa Aprovação</p>
              <p className="text-2xl font-bold">{stats?.approvalRate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-md">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volume Hoje</p>
              <p className="text-lg font-bold">
                R$ {(stats?.volumeToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros Rápidos */}
      <QuickFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={statusFilter === "all" ? [] : [statusFilter]}
        onFilterToggle={(filterId) => {
          setStatusFilter((prev) => (prev === filterId ? "all" : filterId));
        }}
        availableFilters={[
          { id: "draft", label: "Pendente", value: "draft", color: "primary" as const, count: statusCounts.draft },
          { id: "approved", label: "Aprovado", value: "approved", color: "success" as const, count: statusCounts.approved },
          { id: "rejected", label: "Rejeitado", value: "rejected", color: "danger" as const, count: statusCounts.rejected },
          { id: "devolvdo_financeir", label: "Devolvido Financeiro", value: "devolvido_financeiro", color: "warning" as const, count: statusCounts.devolvido_financeiro },
          { id: "fechamento_aprovado", label: "Fechamento Aprovado", value: "fechamento_aprovado", color: "primary" as const, count: statusCounts.fechamento_aprovado }
        ]}
        onClearAll={() => {
          setStatusFilter("all");
          setSearchTerm("");
        }}
        placeholder="Buscar por nome ou CPF do cliente..."
      />

      {/* Tabs: Pendentes / Retorno Fechamento / Concluídas Hoje */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes ({allPendingSims.length})
          </TabsTrigger>
          <TabsTrigger value="retorno_fechamento">
            Retorno Fechamento ({retornoFechamento.length})
          </TabsTrigger>
          <TabsTrigger value="enviado_financeiro">
            Enviado Financeiro ({enviadosFinanceiro.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas Hoje ({allCompletedSims.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Pendentes */}
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
                      <Badge variant="secondary">Pendente</Badge>
                    </div>

                    <div>
                      <h3 className="font-medium">Simulação Multi-Bancos</h3>
                      <p className="text-sm text-muted-foreground">
                        {sim.client?.name || 'Cliente não identificado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aguardando análise do calculista
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Criado em: {new Date(sim.created_at || Date.now()).toLocaleDateString('pt-BR')}
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

        {/* Tab Retorno Fechamento */}
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
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Fechamento Aprovado
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-medium">{caso.client?.name || 'Cliente não identificado'}</h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {caso.client?.cpf || '---'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Revisão final antes de enviar para financeiro
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em: {new Date(caso.last_update_at || Date.now()).toLocaleDateString('pt-BR')}
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

        {/* Tab Enviado Financeiro */}
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
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Aguardando Financeiro
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-medium">{caso.client?.name || 'Cliente não identificado'}</h3>
                      <p className="text-sm text-muted-foreground">CPF: {caso.client?.cpf || '---'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aprovado pelo calculista. Em processamento no financeiro.
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em: {new Date(caso.last_update_at || Date.now()).toLocaleDateString('pt-BR')}
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

        {/* Tab Concluídas Hoje */}
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
                      {sim.status === "approved" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprovado
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitado
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium">Simulação Multi-Bancos</h3>
                      <p className="text-sm text-muted-foreground">
                        {sim.client?.name || 'Cliente não identificado'}
                      </p>
                      {sim.totals?.liberadoCliente && (
                        <p className="text-xs font-semibold text-green-600">
                          R$ {sim.totals.liberadoCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Atualizado em: {new Date(sim.updated_at || sim.created_at).toLocaleDateString('pt-BR')}
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
      </Tabs>

      {/* Modal removido: detalhes do caso não são exibidos nesta página */}
    </div>
  );
}
