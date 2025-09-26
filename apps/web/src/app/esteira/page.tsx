"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, EsteiraCard, Tabs, TabsContent, TabsList, TabsTrigger, CaseListSkeleton } from "@lifecalling/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/api";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query para listar casos globais (apenas não atribuídos)
  const { data: globalCases = [], isLoading: loadingGlobal, error: errorGlobal } = useQuery({
    queryKey: ["cases", "global"],
    queryFn: async () => {
      const response = await API.get("/cases?assigned=0");
      return response.data?.items ?? [];
    },
    staleTime: 30000, // 30 segundos
    retry: 2,
  });

  // Query para listar meus casos
  const { data: myCases = [], isLoading: loadingMine, error: errorMine } = useQuery({
    queryKey: ["cases", "mine"],
    queryFn: async () => {
      const response = await API.get("/cases?mine=true");
      return response.data?.items ?? [];
    },
    staleTime: 30000, // 30 segundos
    retry: 2,
  });

  // Mutation para pegar um caso
  const assignCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await API.post(`/cases/${caseId}/assign`);
      return response.data;
    },
    onSuccess: () => {
      // Atualiza as queries após pegar um caso
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso atribuído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atribuir caso. Tente novamente.");
      console.error("Assign case error:", error);
    },
  });

  const handlePegarCaso = (caseId: number) => {
    assignCaseMutation.mutate(caseId);
  };

  const renderCaseList = (cases: Case[], showPegarButton: boolean, isLoading: boolean, error?: any) => {
    // Debug logging
    console.log('renderCaseList:', { cases, isLoading, error, count: cases?.length });

    if (isLoading) {
      return <CaseListSkeleton count={4} />;
    }

    if (error) {
      console.error('Erro ao carregar casos:', error);
      return (
        <div className="col-span-full text-center py-8 text-destructive">
          Erro ao carregar casos. Tente novamente.
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
            onAssign={showPegarButton ? handlePegarCaso : undefined}
          />
        ))}
        {Array.isArray(cases) && cases.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Nenhum caso encontrado
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Esteira de Casos</h1>
        <div className="flex gap-2">
          <Button variant="outline">Filtros</Button>
          <Button>Novo Caso</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="global">Global ({globalCases.length})</TabsTrigger>
          <TabsTrigger value="mine">Meus Casos ({myCases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Casos Disponíveis</h2>
              <Badge variant="secondary">
                {globalCases.length} disponíveis
              </Badge>
            </div>
            {renderCaseList(globalCases, true, loadingGlobal, errorGlobal)}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Meus Casos</h2>
              <Badge variant="secondary">{myCases.length} casos</Badge>
            </div>
            {renderCaseList(myCases, false, loadingMine, errorMine)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

