"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, EsteiraCard, Tabs, TabsContent, TabsList, TabsTrigger, CaseSkeleton, CaseNotesEditor, KPICard, CasesTable, QuickFilters, Pagination } from "@lifecalling/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStats } from "@/lib/hooks";
import { toast } from "sonner";
import { Clock, CheckCircle, AlertCircle, TrendingUp, DollarSign, Target, Eye, FileText, Archive } from "lucide-react";

interface Case {
  id: number;
  status: string;
  client: {
    name: string;
    cpf: string;
    matricula: string;
  };
  created_at: string;
  assigned_to?: string;
  telefone_preferencial?: string;
  observacoes?: string;
  banco?: string;
}

export default function EsteiraPage() {
  useLiveCaseEvents();
  const [activeTab, setActiveTab] = useState("global");
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  // Estados de paginação e filtro
  const [globalPage, setGlobalPage] = useState(1);
  const [globalPageSize, setGlobalPageSize] = useState(20);
  const [globalStatusFilter, setGlobalStatusFilter] = useState<string[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [myPage, setMyPage] = useState(1);
  const [myPageSize, setMyPageSize] = useState(20);
  const [myStatusFilter, setMyStatusFilter] = useState<string[]>([]);
  const [mySearchTerm, setMySearchTerm] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();

  // Query para métricas do usuário
  const { data: myStats, isLoading: loadingStats } = useMyStats();

  // Query para listar atendimentos globais (apenas não atribuídos)
  const { data: globalData, isLoading: loadingGlobal, error: errorGlobal } = useQuery({
    queryKey: ["cases", "global", globalPage, globalPageSize, globalStatusFilter, globalSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        assigned: "0",
        page: globalPage.toString(),
        page_size: globalPageSize.toString(),
      });

      if (globalStatusFilter.length > 0) {
        params.append("status", globalStatusFilter[0]); // Backend aceita apenas um status por vez
      }

      if (globalSearchTerm) {
        params.append("q", globalSearchTerm);
      }

      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000, // 5 segundos - reduzido para resposta mais rápida
    refetchInterval: 10000, // Revalidar a cada 10s como fallback
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const globalCases = globalData?.items ?? [];
  const globalTotal = globalData?.total ?? 0;
  const globalTotalPages = Math.ceil(globalTotal / globalPageSize);

  // Query para listar meus atendimentos
  const { data: myData, isLoading: loadingMine, error: errorMine } = useQuery({
    queryKey: ["cases", "mine", myPage, myPageSize, myStatusFilter, mySearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        mine: "true",
        page: myPage.toString(),
        page_size: myPageSize.toString(),
      });

      if (myStatusFilter.length > 0) {
        params.append("status", myStatusFilter[0]);
      }

      if (mySearchTerm) {
        params.append("q", mySearchTerm);
      }

      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000, // 5 segundos - reduzido para resposta mais rápida
    refetchInterval: 10000, // Revalidar a cada 10s como fallback
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const myCases = myData?.items ?? [];
  const myTotal = myData?.total ?? 0;
  const myTotalPages = Math.ceil(myTotal / myPageSize);

  // Mutation para pegar um atendimento
  const assignCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post(`/cases/${caseId}/assign`);
      return response.data;
    },
    onSuccess: () => {
      // Atualiza as queries após pegar um caso
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Atendimento atribuído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atribuir atendimento. Tente novamente.");
      console.error("Assign case error:", error);
    },
  });

  // Mutation para atualizar atendimento
  const updateCaseMutation = useMutation({
    mutationFn: async ({ caseId, data }: { caseId: number; data: any }) => {
      const response = await api.patch(`/cases/${caseId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Atendimento atualizado com sucesso!");
      setEditingCase(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar atendimento. Tente novamente.");
      console.error("Update case error:", error);
    },
  });

  const handlePegarAtendimento = (caseId: number) => {
    assignCaseMutation.mutate(caseId);
  };

  const handleEditCase = (caseId: number) => {
    const case_to_edit = [...globalCases, ...myCases].find(c => c.id === caseId);
    if (case_to_edit) {
      setEditingCase(case_to_edit);
    }
  };

  const handleViewCase = (caseId: number) => {
    router.push(`/casos/${caseId}`);
  };

  const handleSaveNotes = (data: { telefone_preferencial?: string; observacoes?: string }) => {
    if (editingCase) {
      updateCaseMutation.mutate({
        caseId: editingCase.id,
        data
      });
    }
  };

  // Definir filtros disponíveis por status
  const statusFilters = [
    { id: "novo", label: "Novo", value: "novo", icon: FileText, color: "primary" as const },
    { id: "em_atendimento", label: "Em Atendimento", value: "em_atendimento", icon: AlertCircle, color: "warning" as const },
    { id: "calculista_pendente", label: "Calculista", value: "calculista_pendente", icon: Clock, color: "secondary" as const },
    { id: "calculo_aprovado", label: "Aprovado", value: "calculo_aprovado", icon: CheckCircle, color: "success" as const },
    { id: "fechamento_aprovado", label: "Fechamento", value: "fechamento_aprovado", icon: Target, color: "success" as const },
    { id: "arquivado", label: "Arquivado", value: "arquivado", icon: Archive, color: "default" as const },
  ];

  // Handlers de filtro para aba global
  const handleGlobalFilterToggle = (filterId: string) => {
    setGlobalStatusFilter((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [filterId]
    );
    setGlobalPage(1); // Reset para primeira página ao filtrar
  };

  const handleGlobalClearFilters = () => {
    setGlobalStatusFilter([]);
    setGlobalSearchTerm("");
    setGlobalPage(1);
  };

  // Handlers de filtro para meus atendimentos
  const handleMyFilterToggle = (filterId: string) => {
    setMyStatusFilter((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [filterId]
    );
    setMyPage(1);
  };

  const handleMyClearFilters = () => {
    setMyStatusFilter([]);
    setMySearchTerm("");
    setMyPage(1);
  };

  const renderCaseList = (cases: Case[], showPegarButton: boolean, isLoading: boolean, error?: any) => {
    // Debug logging
    console.log('renderCaseList:', { cases, isLoading, error, count: cases?.length });

    if (isLoading) {
      return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <CaseSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      console.error('Erro ao carregar atendimentos:', error);
      return (
        <div className="col-span-full text-center py-8 text-destructive">
          Erro ao carregar atendimentos. Tente novamente.
          <br />
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["cases"] })}
            className="mt-2 text-sm underline"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {Array.isArray(cases) && cases.map((caso) => (
          <EsteiraCard
            key={caso.id}
            caso={caso}
            onView={(id) => router.push(`/casos/${id}`)}
            onAssign={showPegarButton ? handlePegarAtendimento : undefined}
            onEdit={handleEditCase}
          />
        ))}
        {Array.isArray(cases) && cases.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Nenhum atendimento encontrado
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Esteira de Atendimentos</h1>
        <div className="flex gap-2">
          <Button variant="outline">Filtros</Button>
          <Button>Novo Atendimento</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="global">Global ({globalTotal})</TabsTrigger>
          <TabsTrigger value="mine">Meus Atendimentos ({myTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <div className="space-y-6">
            {/* Filtros Rápidos */}
            <QuickFilters
              searchTerm={globalSearchTerm}
              onSearchChange={(value) => {
                setGlobalSearchTerm(value);
                setGlobalPage(1);
              }}
              activeFilters={globalStatusFilter}
              onFilterToggle={handleGlobalFilterToggle}
              availableFilters={statusFilters}
              onClearAll={handleGlobalClearFilters}
              placeholder="Buscar por CPF ou nome do cliente..."
            />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Atendimentos Disponíveis</h2>
              <Badge variant="secondary">
                {globalTotal} {globalTotal === 1 ? 'disponível' : 'disponíveis'}
              </Badge>
            </div>

            {renderCaseList(globalCases, true, loadingGlobal, errorGlobal)}

            {/* Paginação */}
            {globalTotal > 0 && (
              <Pagination
                currentPage={globalPage}
                totalPages={globalTotalPages}
                totalItems={globalTotal}
                itemsPerPage={globalPageSize}
                onPageChange={setGlobalPage}
                onItemsPerPageChange={(size) => {
                  setGlobalPageSize(size);
                  setGlobalPage(1);
                }}
                itemsPerPageOptions={[20, 50, 100]}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <div className="space-y-6">
            {/* KPI Cards para Meus Atendimentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KPICard
                title="Total de Casos"
                value={myStats?.totalCases || 0}
                icon={Target}
                trend={myStats?.totalCases > 0 ? 12.5 : 0}
              />
              <KPICard
                title="Casos Ativos"
                value={myStats?.activeCases || 0}
                icon={AlertCircle}
                trend={myStats?.activeCases > 0 ? 8.3 : 0}
              />
              <KPICard
                title="Casos Finalizados"
                value={myStats?.completedCases || 0}
                icon={CheckCircle}
                trend={myStats?.completedCases > 0 ? 15.2 : 0}
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${myStats?.conversionRate || 0}%`}
                icon={TrendingUp}
                trend={myStats?.conversionRate > 50 ? 5.4 : myStats?.conversionRate > 25 ? 0 : -2.1}
              />
              <KPICard
                title="Volume Financeiro"
                value={`R$ ${(myStats?.totalVolume || 0).toLocaleString('pt-BR')}`}
                icon={DollarSign}
                trend={myStats?.totalVolume > 0 ? 18.7 : 0}
              />
              <KPICard
                title="Tempo Médio (dias)"
                value={myStats?.averageTime || 0}
                icon={Clock}
                trend={myStats?.averageTime < 30 ? 10.2 : myStats?.averageTime < 60 ? 0 : -5.8}
              />
            </div>

            {/* Filtros Rápidos */}
            <QuickFilters
              searchTerm={mySearchTerm}
              onSearchChange={(value) => {
                setMySearchTerm(value);
                setMyPage(1);
              }}
              activeFilters={myStatusFilter}
              onFilterToggle={handleMyFilterToggle}
              availableFilters={statusFilters}
              onClearAll={handleMyClearFilters}
              placeholder="Buscar nos meus atendimentos..."
            />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Meus Atendimentos</h2>
              <Badge variant="secondary">
                {myTotal} {myTotal === 1 ? 'atendimento' : 'atendimentos'}
              </Badge>
            </div>

            {/* Tabela de Casos */}
            <CasesTable
              cases={myCases}
              onViewCase={handleViewCase}
              loading={loadingMine}
              className="mt-4"
            />

            {/* Paginação */}
            {myTotal > 0 && (
              <Pagination
                currentPage={myPage}
                totalPages={myTotalPages}
                totalItems={myTotal}
                itemsPerPage={myPageSize}
                onPageChange={setMyPage}
                onItemsPerPageChange={(size) => {
                  setMyPageSize(size);
                  setMyPage(1);
                }}
                itemsPerPageOptions={[20, 50, 100]}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Notes Editor Dialog */}
      <CaseNotesEditor
        open={!!editingCase}
        onOpenChange={(open) => !open && setEditingCase(null)}
        caseId={editingCase?.id || 0}
        initialPhone={editingCase?.telefone_preferencial || ""}
        initialNotes={editingCase?.observacoes || ""}
        onSave={handleSaveNotes}
        isLoading={updateCaseMutation.isPending}
      />
    </div>
  );
}

