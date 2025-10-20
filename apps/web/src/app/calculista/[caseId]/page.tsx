"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAllCaseSimulations, useSetFinalSimulation } from "@/lib/simulation-hooks";
import {
  Card,
  Button,
  Badge,
  CaseSkeleton,
  SimulationHistoryCard,
  SimulationHistoryModal
} from "@lifecalling/ui";
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw, DollarSign } from "lucide-react";
import { SimulationFormMultiBank } from "@/components/calculista/SimulationFormMultiBank";
import { SimulationResultCard } from "@lifecalling/ui";
import type { SimulationInput, SimulationTotals } from "@/lib/types/simulation";
import CaseChat from "@/components/case/CaseChat";
import AdminStatusChanger from "@/components/case/AdminStatusChanger";
import { FinancialInfoModal } from "@/components/calculista/FinancialInfoModal";

export default function CalculistaSimulationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const caseId = parseInt(params.caseId as string);

  const [currentSimulation, setCurrentSimulation] = useState<SimulationInput | null>(null);
  const [currentTotals, setCurrentTotals] = useState<SimulationTotals | null>(null);
  const [simulationId, setSimulationId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState<SimulationInput | null>(null);

  // Helper para extrair mensagem de erro
  const getErrorMessage = (error: any): string => {
    if (typeof error?.response?.data === 'string') {
      return error.response.data;
    }
    if (typeof error?.response?.data?.detail === 'string') {
      return error.response.data.detail;
    }
    if (error?.response?.data?.detail && typeof error.response.data.detail === 'object') {
      return JSON.stringify(error.response.data.detail);
    }
    if (error?.response?.data?.errors) {
      return Array.isArray(error.response.data.errors)
        ? error.response.data.errors.join(', ')
        : JSON.stringify(error.response.data.errors);
    }
    if (error?.message) {
      return error.message;
    }
    return "Erro desconhecido";
  };

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

  // Query para buscar TODAS as simulações do caso
  const { data: allSimulationsData } = useAllCaseSimulations(caseId);
  const simulationHistory = allSimulationsData?.items || [];
  const currentSimulationId = allSimulationsData?.current_simulation_id;

  // Mutation para definir simulação como final
  const setFinalSimulation = useSetFinalSimulation();

  // Query para buscar anexos do caso
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ["attachments", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}/attachments`);
      return response.data?.items || [];
    },
    enabled: !!caseId
  });

  // Flag de status do caso
  const isFechamentoAprovado = caseDetail?.status === "fechamento_aprovado";

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

  // Carregar simulação quando vem do fechamento (pode estar approved)
  useEffect(() => {
    if (isFechamentoAprovado && caseDetail?.last_simulation_id) {
      // Buscar detalhes da última simulação
      const fetchLastSimulation = async () => {
        try {
          const response = await api.get(`/simulations/case/${caseId}/all`);
          const simulations = response.data?.items || [];
          const lastSim = simulations.find((s: any) => s.is_current);

          if (lastSim && lastSim.totals) {
            setSimulationId(lastSim.id);
            setCurrentTotals(lastSim.totals);

            // Reconstruir dados do formulário
            if (lastSim.banks && lastSim.prazo) {
              setCurrentSimulation({
                banks: lastSim.banks.map((b: any) => ({
                  bank: b.banco || b.bank,
                  parcela: b.parcela,
                  saldoDevedor: b.saldoDevedor,
                  valorLiberado: b.valorLiberado
                })),
                prazo: lastSim.prazo,
                coeficiente: lastSim.coeficiente || "",
                seguro: lastSim.totals.seguroObrigatorio || 0,
                percentualConsultoria: lastSim.percentualConsultoria || 0
              });
            }
          }
        } catch (error) {
          console.error("Erro ao carregar simulação:", error);
        }
      };

      fetchLastSimulation();
    }
  }, [isFechamentoAprovado, caseDetail?.last_simulation_id, caseId]);

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
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Erro ao salvar simulação");
    }
  });

  // Mutation para aprovar simulação
  const approveSimulationMutation = useMutation({
    mutationFn: async (simId: number) => {
      const response = await api.post(`/simulations/${simId}/approve`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });

      // Mensagem depende do status do caso após aprovação
      if (data?.case_status === "financeiro_pendente") {
        toast.success("Simulação aprovada! Caso enviado para o financeiro.");
      } else {
        toast.success("Simulação aprovada! Caso retornado ao atendente para envio ao fechamento.");
      }

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
    // Quando vem do fechamento, usar last_simulation_id se simulationId não estiver carregado ainda
    const simIdToApprove = simulationId || caseDetail?.last_simulation_id;

    if (!simIdToApprove) {
      toast.error("Salve a simulação antes de aprovar");
      return;
    }
    approveSimulationMutation.mutate(simIdToApprove);
  };

  const handleReject = () => {
    // Quando vem do fechamento, usar last_simulation_id se simulationId não estiver carregado ainda
    const simIdToReject = simulationId || caseDetail?.last_simulation_id;

    if (!simIdToReject) {
      toast.error("Salve a simulação antes de reprovar");
      return;
    }
    rejectSimulationMutation.mutate({ simId: simIdToReject });
  };

  // Mutation para enviar para financeiro
  const sendToFinanceMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post(`/simulations/${caseId}/send-to-finance`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["/cases", "fechamento_aprovado"] });
      queryClient.invalidateQueries({ queryKey: ["/cases", "financeiro_pendente"] });
      queryClient.invalidateQueries({ queryKey: ["calculation", "kpis"] });
      toast.success("Caso enviado para financeiro!");
      // Redirecionar para a aba Enviado Financeiro
      router.push("/calculista?tab=enviado_financeiro");
    },
    onError: (error: any) => {
      console.error("Erro ao enviar para financeiro:", error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Erro ao enviar para financeiro");
    }
  });

  const handleSendToFinance = () => {
    sendToFinanceMutation.mutate(caseId);
  };

  // Função para fazer download de anexo
  const handleDownloadAttachment = async (attachmentId: number, filename: string) => {
    try {
      const response = await api.get(`/cases/${caseId}/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Download de ${filename} iniciado`);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download do anexo');
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para imprimir a página
  const handlePrint = () => {
    window.print();
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto print-container">
      {/* Admin Status Changer (apenas para admin) - Movido para o topo */}
      <AdminStatusChanger caseId={caseId} currentStatus={caseDetail?.status || ''} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/calculista")}
            className="p-2 print-hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary print-hidden" />
              {isFechamentoAprovado ? "Revisão Final - Retorno Fechamento" : "Simulação Multi-Bancos"}
            </h1>
            <p className="text-muted-foreground">
              Caso #{caseId} - {caseDetail.client?.name}
              {simulationHistory && simulationHistory.length > 0 && (
                <span className="ml-2 text-xs">
                  • {simulationHistory.length} {simulationHistory.length === 1 ? "versão" : "versões"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print-hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["case", caseId] })}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {isFechamentoAprovado && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Fechamento Aprovado
            </Badge>
          )}
        </div>
      </div>

      {/* Layout em 2 colunas: Informações do Cliente e Anexos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Informações do Cliente */}
        <Card className="p-4 card">
          <h3 className="font-medium mb-4">Informações do Cliente</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
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

        {/* Coluna 2: Anexos do Caso */}
        {attachments.length > 0 && (
          <Card className="p-4 card">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-5 w-5 text-primary print-hidden" />
              <h3 className="font-medium">Anexos do Caso ({attachments.length})</h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 attachments-print">
              {attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground print-hidden" />
                    <div>
                      <p className="font-medium text-sm">{attachment.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.size)}</span>
                        <span>•</span>
                        <span>
                          {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                    className="flex items-center gap-2 print-hidden"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Botão Informações Financeiras */}
            {caseDetail?.client?.financiamentos && caseDetail.client.financiamentos.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowFinancialModal(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Ver Informações Financeiras ({caseDetail.client.financiamentos.length})
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <SimulationFormMultiBank
            onCalculate={handleCalculate}
            loading={saveSimulationMutation.isPending}
            initialData={editingSimulation || undefined}
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
                atendente={caseDetail?.assigned_user?.name}
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
                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4"
                  disabled={rejectSimulationMutation.isPending || approveSimulationMutation.isPending}
                  data-testid="approve-button"
                >
                  {approveSimulationMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2 flex-shrink-0" />
                      <span className="truncate">{isFechamentoAprovado ? "Enviando..." : "Aprovando..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{isFechamentoAprovado ? "Aprovar e Enviar" : "Aprovar"}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Status */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={isFechamentoAprovado ? "text-emerald-600" : "text-green-600"}>
                      {isFechamentoAprovado ? "Aprovado pelo Fechamento" : "Simulação Calculada"}
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
              {isFechamentoAprovado && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-sm text-emerald-700">
                    <strong>Retorno de Fechamento:</strong> Revise a simulação e, se necessário, edite os valores. Ao aprovar, o caso será enviado automaticamente para o financeiro.
                  </p>
                </div>
              )}
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

      {/* Botão para abrir histórico */}
      {simulationHistory && simulationHistory.length > 0 && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="w-full"
          >
            <History className="h-4 w-4 mr-2" />
            Ver Histórico de Simulações ({simulationHistory.length})
          </Button>
        </div>
      )}

      {/* Modal de Histórico */}
      <SimulationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={simulationHistory || []}
        caseId={caseId}
        clientName={caseDetail?.client?.name}
        showSetAsFinalButton={true}
        currentSimulationId={currentSimulationId}
        onEditSimulation={(entry) => {
          // Carregar simulação para edição
          // Converter estrutura do backend para o formato esperado
          const banksConverted = entry.banks.map((b: any) => ({
            bank: b.banco || b.bank,
            parcela: b.parcela,
            saldoDevedor: b.saldoDevedor,
            valorLiberado: b.valorLiberado
          }));

          const simulationData = {
            banks: banksConverted,
            prazo: entry.prazo,
            coeficiente: entry.coeficiente || "",
            seguro: entry.totals.seguroObrigatorio || 0,
            percentualConsultoria: entry.percentualConsultoria
          };

          setCurrentSimulation(simulationData);
          setEditingSimulation(simulationData);

          // Garantir que custoConsultoriaLiquido seja sempre number
          const totals = {
            ...entry.totals,
            custoConsultoriaLiquido: entry.totals.custoConsultoriaLiquido || (entry.totals.custoConsultoria * 0.86)
          };
          setCurrentTotals(totals);
          toast.success("Simulação carregada para edição");
          setShowHistoryModal(false);
        }}
        onSetAsFinal={(simulationId) => {
          setFinalSimulation.mutate(simulationId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["simulations", "case", caseId, "all"] });
              queryClient.invalidateQueries({ queryKey: ["case", caseId] });
              toast.success("Simulação definida como final!");
            }
          });
        }}
      />

      {/* Modal Informações Financeiras */}
      {caseDetail?.client?.financiamentos && caseDetail.client.financiamentos.length > 0 && (
        <FinancialInfoModal
          isOpen={showFinancialModal}
          onClose={() => setShowFinancialModal(false)}
          financiamentos={caseDetail.client.financiamentos}
          clientMatricula={caseDetail.client.matricula}
          clientName={caseDetail.client.name}
          simulationTotals={currentTotals || undefined}
        />
      )}


      {/* Chat do Calculista */}
      <CaseChat caseId={caseId} defaultChannel="SIMULACAO" />
    </div>
  );
}