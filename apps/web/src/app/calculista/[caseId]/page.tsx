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
  SimulationHistoryCard,
  SimulationHistoryModal
} from "@lifecalling/ui";
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer } from "lucide-react";
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  // Query para buscar anexos do caso
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ["attachments", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}/attachments`);
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

  // Flags de status do caso
  const isFechamentoAprovado = caseDetail?.status === "fechamento_aprovado";
  const isRetornoFechamento = caseDetail?.status === "retorno_fechamento";

  // Mutation para aprovar simulação
  const approveSimulationMutation = useMutation({
    mutationFn: async (simId: number) => {
      const response = await api.post(`/simulations/${simId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      if (isRetornoFechamento) {
        toast.success("Simulação aprovada! Enviando para financeiro...");
        // Após aprovar, enviar ao financeiro automaticamente
        sendToFinanceMutation.mutate(caseId);
      } else {
        toast.success("Simulação aprovada! Caso movido para fechamento.");
        router.push("/calculista");
      }
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
      queryClient.invalidateQueries({ queryKey: ["/cases", "retorno_fechamento_and_fechamento_aprovado"] });
      queryClient.invalidateQueries({ queryKey: ["/cases", "financeiro_pendente"] });
      queryClient.invalidateQueries({ queryKey: ["calculation", "kpis"] });
      toast.success("Caso enviado para financeiro!");
      // Redirecionar para a aba Enviado Financeiro
      router.push("/calculista?tab=enviado_financeiro");
    },
    onError: (error: any) => {
      console.error("Erro ao enviar para financeiro:", error);
      toast.error(error.response?.data?.detail || "Erro ao enviar para financeiro");
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

  // Verificar se é retorno de fechamento aprovado (mantém apenas fechamento_aprovado para UI)
  // Para casos em retorno_fechamento, a aprovação dispara envio automático ao financeiro
  // A flag isFechamentoAprovado acima já foi definida.

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
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print-hidden">
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
              {isFechamentoAprovado ? (
                <Button
                  onClick={handleSendToFinance}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={sendToFinanceMutation.isPending}
                  data-testid="send-to-finance-button"
                >
                  {sendToFinanceMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enviar para Financeiro
                    </>
                  )}
                </Button>
              ) : (
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
              )}

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
                    <strong>Retorno de Fechamento:</strong> Revise a simulação e, se necessário, edite os valores. Após confirmar, envie para o financeiro.
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
        onEditSimulation={(entry) => {
          // Carregar simulação para edição
          // Converter estrutura do backend para o formato esperado
          const banksConverted = entry.banks.map((b: any) => ({
            bank: b.banco || b.bank,
            parcela: b.parcela,
            saldoDevedor: b.saldoDevedor,
            valorLiberado: b.valorLiberado
          }));

          setCurrentSimulation({
            banks: banksConverted,
            prazo: entry.prazo,
            coeficiente: "",
            seguro: entry.totals.seguroObrigatorio || 0,
            percentualConsultoria: entry.percentualConsultoria
          });

          // Garantir que custoConsultoriaLiquido seja sempre number
          const totals = {
            ...entry.totals,
            custoConsultoriaLiquido: entry.totals.custoConsultoriaLiquido || (entry.totals.custoConsultoria * 0.86)
          };
          setCurrentTotals(totals);
          toast.success("Simulação carregada para edição");
          setShowHistoryModal(false);
        }}
      />
    </div>
  );
}