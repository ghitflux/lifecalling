"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  Card,
  Button,
  Badge,
  CaseSkeleton,
  SimulationHistoryCard
} from "@lifecalling/ui";
import { ArrowLeft, Calculator, CheckCircle, XCircle, History } from "lucide-react";
import { SimulationFormMultiBank } from "@/components/calculista/SimulationFormMultiBank";
import { SimulationResultCard } from "@lifecalling/ui";
import type { SimulationInput, SimulationTotals } from "@/lib/types/simulation";

export default function CalculistaSimulationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const caseId = parseInt(params.caseId as string);

  const [currentSimulation, setCurrentSimulation] = useState<SimulationInput | null>(null);
  const [currentTotals, setCurrentTotals] = useState<SimulationTotals | null>(null);
  const [simulationId, setSimulationId] = useState<number | null>(null);

  // Verificar permissões
  useEffect(() => {
    if (user && !["calculista", "supervisor", "admin"].includes(user.role)) {
      router.push("/esteira");
      toast.error("Acesso negado");
    }
  }, [user, router]);

  // Query para buscar detalhes do caso
  const { data: caseDetail, isLoading: caseLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    },
    enabled: !!caseId
  });

  // Query para buscar histórico de simulações
  const { data: simulationHistory } = useQuery({
    queryKey: ["simulationHistory", caseId],
    queryFn: async () => {
      const response = await api.get(`/simulations/${caseId}/history`);
      return response.data?.items || [];
    },
    enabled: !!caseId
  });

  // Carregar simulação já calculada (quando reabre detalhes)
  useEffect(() => {
    if (caseDetail?.simulation && caseDetail.simulation.status === 'draft' && caseDetail.simulation.totals) {
      // Simulação draft com totals = já foi calculada mas ainda não foi aprovada/rejeitada
      setCurrentTotals(caseDetail.simulation.totals);
      setSimulationId(caseDetail.simulation.id);

      // Reconstruir currentSimulation a partir dos dados salvos
      if (caseDetail.simulation.banks && caseDetail.simulation.prazo) {
        setCurrentSimulation({
          banks: caseDetail.simulation.banks,
          prazo: caseDetail.simulation.prazo,
          coeficiente: "",
          seguro: caseDetail.simulation.totals.seguroObrigatorio || 0,
          percentualConsultoria: caseDetail.simulation.percentualConsultoria || 0
        });
      }
    }
  }, [caseDetail]);

  // Mutation para salvar simulação
  const saveSimulationMutation = useMutation({
    mutationFn: async (data: SimulationInput) => {
      const response = await api.post(`/simulations/${caseId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setSimulationId(data.id);
      setCurrentTotals(data.totals);
      toast.success("Simulação salva com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao salvar simulação:", error);
      toast.error(error.response?.data?.detail || "Erro ao salvar simulação");
    }
  });

  // Mutation para aprovar simulação
  const approveSimulationMutation = useMutation({
    mutationFn: async (simId: number) => {
      const response = await api.post(`/simulations/${simId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success("Simulação aprovada! Caso movido para fechamento.");
      router.push("/calculista");
    },
    onError: (error: any) => {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar simulação");
    }
  });

  // Mutation para reprovar simulação
  const rejectSimulationMutation = useMutation({
    mutationFn: async ({ simId, reason }: { simId: number; reason?: string }) => {
      const response = await api.post(`/simulations/${simId}/reject`, {
        reason: reason || "Simulação rejeitada pelo calculista"
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success("Simulação rejeitada. Caso retornado para esteira.");
      router.push("/calculista");
    },
    onError: (error: any) => {
      console.error("Erro ao rejeitar:", error);
      toast.error("Erro ao rejeitar simulação");
    }
  });

  const handleCalculate = (data: SimulationInput) => {
    setCurrentSimulation(data);
    saveSimulationMutation.mutate(data);
  };

  const handleApprove = () => {
    if (!simulationId) {
      toast.error("Salve a simulação antes de aprovar");
      return;
    }
    approveSimulationMutation.mutate(simulationId);
  };

  const handleReject = () => {
    if (!simulationId) {
      toast.error("Salve a simulação antes de reprovar");
      return;
    }
    rejectSimulationMutation.mutate({ simId: simulationId });
  };

  if (caseLoading) {
    return <CaseSkeleton />;
  }

  if (!caseDetail) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Caso não encontrado</h1>
          <Button onClick={() => router.push("/calculista")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/calculista")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Simulação Multi-Bancos
          </h1>
          <p className="text-muted-foreground">
            Caso #{caseId} - {caseDetail.client?.name}
          </p>
        </div>
      </div>

      {/* Case Details Summary */}
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
            <span className="font-medium">Órgão:</span>
            <p>{caseDetail.client?.orgao || 'Não informado'}</p>
          </div>
        </div>
        {caseDetail.client?.observacoes && (
          <div className="mt-3 pt-3 border-t">
            <span className="font-medium text-sm">Observações:</span>
            <p className="text-sm text-muted-foreground mt-1">
              {caseDetail.client.observacoes}
            </p>
          </div>
        )}
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <SimulationFormMultiBank
            onCalculate={handleCalculate}
            loading={saveSimulationMutation.isPending}
          />
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {currentTotals ? (
            <>
              <SimulationResultCard
                totals={currentTotals}
                simulation={currentSimulation}
                isActive={true}
              />

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  disabled={rejectSimulationMutation.isPending || approveSimulationMutation.isPending}
                  data-testid="reject-button"
                >
                  {rejectSimulationMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Rejeitando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reprovar
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={rejectSimulationMutation.isPending || approveSimulationMutation.isPending}
                  data-testid="approve-button"
                >
                  {approveSimulationMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </>
                  )}
                </Button>
              </div>

              {/* Status */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-green-600">
                      Simulação Calculada
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Valor para Cliente:</span>
                    <span className="font-bold text-green-600">
                      R$ {currentTotals.liberadoCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Aguardando Cálculo
              </h3>
              <p className="text-xs text-muted-foreground">
                Preencha os dados no formulário e clique em &quot;Calcular Simulação&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Simulações */}
      {simulationHistory && simulationHistory.length > 0 && (
        <div className="mt-6">
          <SimulationHistoryCard
            history={simulationHistory}
            onSelectSimulation={(entry) => {
              // Ao clicar em uma simulação do histórico, mostra seus dados
              toast.info(`Visualizando simulação #${entry.simulation_id}`);
            }}
          />
        </div>
      )}
    </div>
  );
}