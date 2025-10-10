"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function EsteiraPageContent() {
  useLiveCaseEvents();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("global");
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  // Estados de paginaÃ§Ã£o e filtro
  const [globalPage, setGlobalPage] = useState(1);
  const [globalPageSize, setGlobalPageSize] = useState(20);
  const [globalStatusFilter, setGlobalStatusFilter] = useState<string[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [myPage, setMyPage] = useState(1);
  const [myPageSize, setMyPageSize] = useState(20);
  const [myStatusFilter, setMyStatusFilter] = useState<string[]>([]);
  const [mySearchTerm, setMySearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Restaurar estado da esteira quando a página carregar
  useEffect(() => {
    const savedPage = searchParams.get('page');
    const savedTab = searchParams.get('tab');
    const savedStatus = searchParams.get('status');
    const savedSearch = searchParams.get('search');

    console.log('Parâmetros da URL:', { savedPage, savedTab, savedStatus, savedSearch });

    // Só alterar a aba se houver parâmetro explícito na URL
    if (savedTab && (savedTab === 'mine' || savedTab === 'global')) {
      setActiveTab(savedTab);
    }
    // Se não houver parâmetro de aba, manter o padrão (global)

    if (savedPage) {
      const pageNum = parseInt(savedPage);
      const tabToUse = savedTab || 'global'; // Usar global como padrão se não houver tab
      console.log('Restaurando página:', { pageNum, tabToUse });
      
      if (tabToUse === 'mine') {
        setMyPage(pageNum);
      } else {
        setGlobalPage(pageNum);
      }
    }

    if (savedStatus) {
      const statusArray = savedStatus.split(',');
      const tabToUse = savedTab || 'global';
      if (tabToUse === 'mine') {
        setMyStatusFilter(statusArray);
      } else {
        setGlobalStatusFilter(statusArray);
      }
    }

    if (savedSearch) {
      const tabToUse = savedTab || 'global';
      if (tabToUse === 'mine') {
        setMySearchTerm(savedSearch);
      } else {
        setGlobalSearchTerm(savedSearch);
      }
    }
  }, [searchParams]);

  // Query para mÃ©tricas do usuÃ¡rio
  const { data: myStats, isLoading: loadingStats } = useMyStats();

  // Debug do estado da página
  console.log('Estado atual da esteira:', {
    activeTab,
    globalPage,
    myPage,
    globalStatusFilter,
    myStatusFilter
  });

  // Query para listar atendimentos globais
  const { data: globalData, isLoading: loadingGlobal, error: errorGlobal } = useQuery({
    queryKey: ["cases", "global", globalPage, globalPageSize, globalStatusFilter, globalSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: globalPage.toString(),
        page_size: globalPageSize.toString(),
        order: "financiamentos_desc", // Ordenar por nÃºmero de financiamentos (decrescente)
      });

      // Admin e supervisor veem TODOS os casos quando aplicam filtros ou buscam
      // Atendentes veem apenas casos disponíveis (assigned=0)
      if (globalStatusFilter.length > 0) {
        params.append("status", globalStatusFilter[0]);
        // Não adicionar filtro de assigned quando houver filtro de status
      } else if (!globalSearchTerm) {
        // Sem filtro de status E sem busca: mostrar apenas casos não atribuídos
        params.append("assigned", "0");
      }
      // Se houver busca (globalSearchTerm), não adiciona assigned=0 para permitir buscar em todos os casos

      if (globalSearchTerm) {
        params.append("q", globalSearchTerm);
      }

      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000, // 5 segundos - reduzido para resposta mais rÃ¡pida
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
    staleTime: 5000, // 5 segundos - reduzido para resposta mais rÃ¡pida
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
      return { data: response.data, caseId };
    },
    onSuccess: (result) => {
      // Atualiza as queries apÃ³s pegar um caso
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Atendimento atribuí­do com sucesso!");
      // Redireciona automaticamente para os detalhes do caso
      router.push(`/casos/${result.caseId}`);
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
    // Salvar estado atual da esteira no sessionStorage
    const currentPage = activeTab === 'mine' ? myPage : globalPage;
    const currentStatusFilter = activeTab === 'mine' ? myStatusFilter : globalStatusFilter;
    const currentSearchTerm = activeTab === 'mine' ? mySearchTerm : globalSearchTerm;
    
    // Forçar aba global se não estiver explicitamente em 'mine'
    const tabToSave = activeTab === 'mine' ? 'mine' : 'global';
    
    console.log('Salvando estado antes de navegar:', {
      currentPage,
      tabToSave,
      activeTab,
      globalPage,
      myPage
    });
    
    sessionStorage.setItem('esteira-page', currentPage.toString());
    sessionStorage.setItem('esteira-tab', tabToSave);
    sessionStorage.setItem('esteira-filters', JSON.stringify({
      status: currentStatusFilter,
      search: currentSearchTerm
    }));
    
    // Verificar se foi salvo corretamente
    const savedPage = sessionStorage.getItem('esteira-page');
    const savedTab = sessionStorage.getItem('esteira-tab');
    console.log('Verificação após salvar:', { savedPage, savedTab });
    
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

  // Definir filtros disponíveis por status (sem contadores)
  const statusFilters = [
    { id: "novo", label: "Novo", value: "novo", icon: FileText, color: "primary" as const },
    { id: "em_atendimento", label: "Em Atendimento", value: "em_atendimento", icon: AlertCircle, color: "warning" as const },
    { id: "calculista_pendente", label: "Calculista", value: "calculista_pendente", icon: Clock, color: "secondary" as const },
    { id: "calculo_aprovado", label: "Cálculo Aprovado", value: "calculo_aprovado", icon: CheckCircle, color: "success" as const },
    { id: "fechamento_aprovado", label: "Fechamento Aprovado", value: "fechamento_aprovado", icon: Target, color: "success" as const },
    { id: "contrato_efetivado", label: "Efetivados", value: "contrato_efetivado", icon: DollarSign, color: "success" as const },
    { id: "contrato_cancelado", label: "Cancelados", value: "contrato_cancelado", icon: AlertCircle, color: "destructive" as const },
    { id: "devolvido", label: "Devolvidos", value: "devolvido", icon: TrendingUp, color: "warning" as const },
    { id: "arquivado", label: "Arquivado", value: "arquivado", icon: Archive, color: "default" as const },
  ];

  // Handlers de filtro para aba global
  const handleGlobalFilterToggle = (filterId: string) => {
    setGlobalStatusFilter((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [filterId]
    );
    setGlobalPage(1); // Reset para primeira pÃ¡gina ao filtrar
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
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }, (_, i) => (
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
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.isArray(cases) && cases.map((caso) => (
          <EsteiraCard
            key={caso.id}
            caso={caso}
            onView={handleViewCase}
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="global">Global ({globalTotal})</TabsTrigger>
          <TabsTrigger value="mine">Meus Atendimentos ({myTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <div className="space-y-6">
            {/* Filtros RÃ¡pidos */}
            <QuickFilters
              searchTerm={globalSearchTerm}
              onSearchChange={(value) => {
                setGlobalSearchTerm(value);
                setGlobalPage(1);
              }}
              activeFilters={globalStatusFilter}
              onFilterToggle={handleGlobalFilterToggle}
              availableFilters={statusFilters as any}
              onClearAll={handleGlobalClearFilters}
              placeholder="Buscar por CPF ou nome do cliente..."
            />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Atendimentos Disponí­veis</h2>
              <Badge variant="secondary">
                {globalTotal} {globalTotal === 1 ? 'disponí­vel' : 'disponí­veis'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <KPICard
                title="Total de Casos"
                value={myStats?.totalCases || 0}
                icon={Target}
              />
              <KPICard
                title="Casos Ativos"
                value={myStats?.activeCases || 0}
                icon={AlertCircle}
              />
              <KPICard
                title="Casos Finalizados"
                value={myStats?.completedCases || 0}
                icon={CheckCircle}
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${myStats?.conversionRate || 0}%`}
                icon={TrendingUp}
              />
              <KPICard
                title="Volume Financeiro"
                value={`R$ ${(myStats?.totalVolume || 0).toLocaleString('pt-BR')}`}
                icon={DollarSign}
              />
            </div>

            {/* Filtros RÃ¡pidos */}
            <QuickFilters
              searchTerm={mySearchTerm}
              onSearchChange={(value) => {
                setMySearchTerm(value);
                setMyPage(1);
              }}
              activeFilters={myStatusFilter}
              onFilterToggle={handleMyFilterToggle}
              availableFilters={statusFilters as any}
              onClearAll={handleMyClearFilters}
              placeholder="Buscar nos meus atendimentos..."
            />

            {/* <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Meus Atendimentos</h2>
              <Badge variant="secondary">
                {myTotal} {myTotal === 1 ? 'atendimento' : 'atendimentos'}
              </Badge>
            </div> */}

            {/* Tabela de Casos */}
            <CasesTable
              cases={myCases}
              onViewCase={handleViewCase}
              loading={loadingMine}
              className="mt-4"
              showFilters={false}
            />

            {/* PaginaÃ§Ã£o */}
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

export default function EsteiraPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EsteiraPageContent />
    </Suspense>
  );
}


