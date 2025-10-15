"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Badge, EsteiraCard, Tabs, TabsContent, TabsList, TabsTrigger, CaseSkeleton, CaseNotesEditor, KPICard, CasesTable, Pagination } from "@lifecalling/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStats } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { buildCasesQuery } from "@/lib/query";
import { toast } from "sonner";
import { Search, X, Building2, Activity, CheckCircle, AlertCircle, TrendingUp, DollarSign, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  const { user } = useAuth();  // Adicionar hook de autenticação
  const [activeTab, setActiveTab] = useState("global");
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  // Verificar se é admin ou supervisor
  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  // Estados de paginação e filtro (simplificados)
  const [globalPage, setGlobalPage] = useState(1);
  const [globalPageSize, setGlobalPageSize] = useState(20);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [globalSelectedStatus, setGlobalSelectedStatus] = useState<string[]>([]);
  const [globalEntityFilter, setGlobalEntityFilter] = useState("");

  const [myPage, setMyPage] = useState(1);
  const [myPageSize, setMyPageSize] = useState(20);
  const [mySearchTerm, setMySearchTerm] = useState("");
  const [mySelectedStatus, setMySelectedStatus] = useState<string[]>([]);
  const [myEntityFilter, setMyEntityFilter] = useState("");

  // Busca em tempo real (como módulo Clientes)

  const queryClient = useQueryClient();

  // Reset página quando filtros mudam
  useEffect(() => {
    setGlobalPage(1);
  }, [globalSelectedStatus, globalSearchTerm]);
  

  useEffect(() => {
    setMyPage(1);
  }, [mySelectedStatus, mySearchTerm]);

  useEffect(() => {
    setGlobalPage(1);
  }, [globalPageSize]);

  useEffect(() => {
    setMyPage(1);
  }, [myPageSize]);

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
      const tabToUse = savedTab || 'global';
      if (tabToUse === 'mine') {
        setMySelectedStatus([savedStatus]);
      } else {
        setGlobalSelectedStatus([savedStatus]);
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

  // Query para listar atendimentos globais
  const { data: globalData, isLoading: loadingGlobal, error: errorGlobal } = useQuery({
    queryKey: [
      "cases",
      "global",
      globalPage,
      globalPageSize,
      globalSelectedStatus,
      globalSearchTerm,
      globalEntityFilter
    ],
    queryFn: async () => {
      const isManager = ["admin", "supervisor"].includes(user?.role ?? "");

      const params = buildCasesQuery(
        isManager
          ? {
              page: globalPage,
              page_size: globalPageSize,
              order: "financiamentos_desc",
              q: globalSearchTerm,
              entidade: globalEntityFilter || undefined,
              status: globalSelectedStatus.length ? globalSelectedStatus : undefined,
            }
          : {
              page: globalPage,
              page_size: globalPageSize,
              order: "financiamentos_desc",
              q: globalSearchTerm,
              entidade: globalEntityFilter || undefined,
              status: ["novo"],     // atendente só vê novos
              // REMOVIDO assigned=0 para permitir ver casos expirados também
            }
      );

      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const globalCases = globalData?.items ?? [];
  const globalTotal = globalData?.total ?? 0;
  const globalTotalPages = Math.ceil(globalTotal / globalPageSize);

  // Query para listar meus atendimentos
  const { data: myData, isLoading: loadingMine, error: errorMine } = useQuery({
    queryKey: ["cases", "mine", myPage, myPageSize, mySelectedStatus, mySearchTerm, myEntityFilter],
    queryFn: async () => {
      const params = buildCasesQuery({
        page: myPage,
        page_size: myPageSize,
        q: mySearchTerm,
        entidade: myEntityFilter || undefined,
        status: mySelectedStatus.length ? mySelectedStatus : undefined,
        mine: true,
      });

      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
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
    const currentStatusFilter = activeTab === 'mine' ? mySelectedStatus : globalSelectedStatus;
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

  // Query para buscar filtros disponíveis (bancos e status)
  const { data: filtersData } = useQuery({
    queryKey: ["client-filters"],
    queryFn: async () => {
      const response = await api.get("/clients/filters");
      return response.data;
    },
    staleTime: 60000, // Cache por 1 minuto
  });

  const renderCaseList = (cases: Case[], showPegarButton: boolean, isLoading: boolean, error?: any) => {

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
            {/* Filtros - Sistema Clientes */}
            <Card className="p-4 space-y-4">
              {/* Busca */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou banco..."
                    value={globalSearchTerm}
                    onChange={(e) => {
                      setGlobalSearchTerm(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border border-input bg-muted text-foreground placeholder:text-muted-foreground"
                  />
                  {globalSearchTerm && (
                    <button
                      onClick={() => {
                        setGlobalSearchTerm("");
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {globalTotal} {globalTotal === 1 ? 'disponível' : 'disponíveis'}
                </div>
              </div>

              {/* Filtros Rápidos */}
              <div className="space-y-3">

                {/* Filtro por Status - APENAS ADMIN */}
                {isAdminOrSupervisor && filtersData?.status && filtersData.status.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status:</span>
                      {globalSelectedStatus.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGlobalSelectedStatus([]);
                          }}
                          className="h-6 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filtersData.status.map((status: any) => (
                        <Badge
                          key={status.value}
                          variant={globalSelectedStatus.includes(status.value) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            setGlobalSelectedStatus(prev =>
                              prev.includes(status.value)
                                ? prev.filter(s => s !== status.value)
                                : [...prev, status.value]
                            );
                          }}
                        >
                          {status.label} ({status.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

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

            {/* Filtros - Sistema Clientes */}
            <Card className="p-4 space-y-4">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                    placeholder="Buscar por nome, CPF ou banco..."
                  value={mySearchTerm}
                  onChange={(e) => {
                    setMySearchTerm(e.target.value);
                  }}
                  className="w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border border-input bg-muted text-foreground placeholder:text-muted-foreground"
                />
                {mySearchTerm && (
                  <button
                    onClick={() => {
                      setMySearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtros Rápidos por Status */}
              {filtersData?.status && filtersData.status.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status:</span>
                    {mySelectedStatus.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMySelectedStatus([]);
                        }}
                        className="h-6 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filtersData.status.map((status: any) => (
                      <Badge
                        key={status.value}
                        variant={mySelectedStatus.includes(status.value) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setMySelectedStatus(prev =>
                            prev.includes(status.value)
                              ? prev.filter(s => s !== status.value)
                              : [...prev, status.value]
                          );
                        }}
                      >
                        {status.label} ({status.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contador de Casos */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Total de casos atribuídos: <strong>{myTotal}</strong></span>
              </div>
            </Card>

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


