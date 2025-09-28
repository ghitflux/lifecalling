"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import {
  SimulationWorkspace,
  Card,
  CaseDetails,
  Button,
  Badge,
  CaseSkeleton,
  type SimulationResult
} from "@lifecalling/ui";
import {
  usePendingSimulations,
  useApproveSimulation,
  useRejectSimulation,
  useCalculistaStats,
  useUpdateCaseStatus
} from "@/lib/simulation-hooks";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Calculator, ArrowLeft } from "lucide-react";

export default function CalculistaPage(){
  useLiveCaseEvents();
  const queryClient = useQueryClient();
  const { data: sims, isLoading: simsLoading } = usePendingSimulations();
  const { data: stats } = useCalculistaStats();
  const [activeSimulation, setActiveSimulation] = useState<number | null>(null);
  const approveSimulation = useApproveSimulation();
  const rejectSimulation = useRejectSimulation();
  const updateCaseStatus = useUpdateCaseStatus();

  // Query para buscar detalhes da simulação ativa
  const { data: activeSimData, isLoading: simLoading } = useQuery({
    queryKey: ["simulation", activeSimulation],
    queryFn: async () => {
      if (!activeSimulation) return null;
      return sims?.find((s: any) => s.id === activeSimulation);
    },
    enabled: !!activeSimulation && !!sims
  });

  // Query para buscar detalhes do caso relacionado
  const { data: caseDetail, isLoading: caseLoading } = useQuery({
    queryKey: ["case", activeSimData?.case_id],
    queryFn: async () => {
      if (!activeSimData?.case_id) return null;
      const response = await api.get(`/cases/${activeSimData.case_id}`);
      return response.data;
    },
    enabled: !!activeSimData?.case_id
  });

  // Mutation para criar nova simulação
  const createSimulationMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post("/simulations", { case_id: caseId });
      return response.data;
    },
    onSuccess: (newSim) => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      setActiveSimulation(newSim.id);
      toast.success("Nova simulação criada!");
    },
    onError: () => {
      toast.error("Erro ao criar simulação");
    }
  });

  // Handlers para aprovação e rejeição
  const handleApprove = async (result: SimulationResult) => {
    if (!activeSimulation || !activeSimData) return;

    try {
      // Aprovar simulação
      await approveSimulation.mutateAsync({
        simId: activeSimulation,
        payload: {
          manual_input: {
            banco: result.banco,
            saldoDevedor: result.saldoDevedor,
            parcelas: result.prazo,
            taxaJuros: result.taxaJuros,
            seguroObrigatorio: result.seguroObrigatorio,
            percentualConsultoria: result.percentualConsultoria * 100,
            coeficiente: result.coeficiente
          },
          results: result
        }
      });

      // Atualizar status do caso para "simulacao_aprovada"
      await updateCaseStatus.mutateAsync({
        caseId: activeSimData.case_id,
        status: "simulacao_aprovada",
        simulationData: result
      });

      toast.success("Simulação aprovada! Caso movido para fechamento.");
      setActiveSimulation(null); // Voltar para lista
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar simulação");
    }
  };

  const handleReject = async (reason?: string) => {
    if (!activeSimulation || !activeSimData) return;

    try {
      // Rejeitar simulação
      await rejectSimulation.mutateAsync({
        simId: activeSimulation,
        payload: {
          reason: reason || "Simulação rejeitada pelo calculista"
        }
      });

      // Atualizar status do caso para "simulacao_rejeitada"
      await updateCaseStatus.mutateAsync({
        caseId: activeSimData.case_id,
        status: "simulacao_rejeitada"
      });

      toast.success("Simulação rejeitada. Caso retornado para esteira.");
      setActiveSimulation(null); // Voltar para lista
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast.error("Erro ao rejeitar simulação");
    }
  };

  // Loading state
  if (simsLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Se está trabalhando numa simulação específica
  if (activeSimulation && activeSimData) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveSimulation(null)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              Simulação #{activeSimulation}
            </h1>
            <p className="text-muted-foreground">
              Caso #{activeSimData.case_id} - {caseDetail?.client?.name}
            </p>
          </div>
        </div>

        {/* Case Details Summary */}
        {caseDetail && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span>
                <p>{caseDetail.client?.name}</p>
              </div>
              <div>
                <span className="font-medium">CPF:</span>
                <p>{caseDetail.client?.cpf}</p>
              </div>
              <div>
                <span className="font-medium">Matrícula:</span>
                <p>{caseDetail.client?.matricula}</p>
              </div>
              <div>
                <span className="font-medium">Telefone:</span>
                <p>{caseDetail.telefone_preferencial || 'Não informado'}</p>
              </div>
            </div>
            {caseDetail.observacoes && (
              <div className="mt-3 pt-3 border-t">
                <span className="font-medium text-sm">Observações:</span>
                <p className="text-sm text-muted-foreground mt-1">{caseDetail.observacoes}</p>
              </div>
            )}
          </Card>
        )}

        {/* Simulation Workspace */}
        <SimulationWorkspace
          caseId={activeSimData.case_id}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={approveSimulation.isPending || rejectSimulation.isPending || updateCaseStatus.isPending}
          showActions={true}
        />
      </div>
    );
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
          {sims?.length || 0} simulações pendentes
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Simulações Pendentes</p>
              <p className="text-2xl font-bold">{sims?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md">
              <Calculator className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprovadas Hoje</p>
              <p className="text-2xl font-bold">{stats?.approvedToday || 0}</p>
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
      </div>

      {/* Simulações List */}
      {(!sims || sims.length === 0) ? (
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
          {sims.map((sim: any) => (
            <Card
              key={sim.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSimulation(sim.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">SIM #{sim.id}</Badge>
                  <Badge variant="secondary">Pendente</Badge>
                </div>

                <div>
                  <h3 className="font-medium">Caso #{sim.case_id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Aguardando análise do calculista
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(sim.created_at || Date.now()).toLocaleDateString('pt-BR')}
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  Analisar Simulação
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
