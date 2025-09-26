"use client";
import { useCaseEventsReload } from "@/lib/ws";
import { useState } from "react";
import { Button, Badge, CaseCard, Tabs, TabsContent, TabsList, TabsTrigger } from "@lifecalling/ui";
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
}

export default function EsteiraPage() {
  useCaseEventsReload();
  const [activeTab, setActiveTab] = useState("global");
  const queryClient = useQueryClient();

  // Query para listar casos globais
  const { data: globalCases = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ["cases", "global"],
    queryFn: async () => {
      const response = await API.get("/cases");
      return response.data?.items ?? [];
    },
  });

  // Query para listar meus casos
  const { data: myCases = [], isLoading: loadingMine } = useQuery({
    queryKey: ["cases", "mine"],
    queryFn: async () => {
      const response = await API.get("/cases?mine=true");
      return response.data?.items ?? [];
    },
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

  const renderCaseList = (cases: Case[], showPegarButton: boolean) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.isArray(cases) && cases.map((caso) => (
        <CaseCard
          key={caso.id}
          item={caso}
          href={`/casos/${caso.id}`}
          onAssign={showPegarButton && !caso.assigned_to ? handlePegarCaso : undefined}
        />
      ))}
      {Array.isArray(cases) && cases.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Nenhum caso encontrado
        </div>
      )}
    </div>
  );

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
                {globalCases.filter((c: Case) => !c.assigned_to).length} disponíveis
              </Badge>
            </div>
            {loadingGlobal ? (
              <div className="text-center py-8">Carregando casos...</div>
            ) : (
              renderCaseList(globalCases, true)
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Meus Casos</h2>
              <Badge variant="secondary">{myCases.length} casos</Badge>
            </div>
            {loadingMine ? (
              <div className="text-center py-8">Carregando meus casos...</div>
            ) : (
              renderCaseList(myCases, false)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

