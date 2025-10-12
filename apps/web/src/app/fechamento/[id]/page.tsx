"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useClosingApprove, useClosingReject, useCaseEvents, useClosingCaseDetails, useAttachments } from "@/lib/hooks";
import { Button, Card, CaseDetails, SimulationResultCard, SimulationHistoryModal, Tabs, TabsList, TabsTrigger, TabsContent, CaseHistory, Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from "@lifecalling/ui";
import { ArrowLeft, History, CheckCircle, XCircle, Eye, User, DollarSign, Calendar, FileText, Download, FileImage, File, Printer, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CaseChat from "@/components/case/CaseChat";
import AdminStatusChanger from "@/components/case/AdminStatusChanger";
import FinanciamentosModal from "@/components/case/FinanciamentosModal";

export default function FechamentoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = parseInt(params.id as string);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFinanciamentosModal, setShowFinanciamentosModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Hook para buscar detalhes completos do caso
  const { data: fullCaseDetails } = useClosingCaseDetails(selectedCaseId || 0);

  // Hooks para aprovação e rejeição
  const approve = useClosingApprove();
  const reject = useClosingReject();


  // Buscar detalhes do caso
  const { data: caseData, isLoading } = useQuery({
    queryKey: ["cases", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    },
  });

  // Buscar histórico de simulações
  const { data: simulationHistory } = useQuery({
    queryKey: ["simulationHistory", caseId],
    queryFn: async () => {
      const response = await api.get(`/simulations/${caseId}/history`);
      return response.data?.items || [];
    },
    enabled: !!caseId
  });

  // Buscar eventos do caso para usar como notas
  const { data: caseEvents, error: eventsError, isLoading: eventsLoading } = useCaseEvents(Number(caseId));

  // Buscar anexos do caso
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(caseId);

  // Converter eventos para formato de notas
  const notes = useMemo(() => {
    if (!caseEvents || !Array.isArray(caseEvents)) {
      return [];
    }

    const filteredEvents = caseEvents.filter((event: any) => {
      // Filtrar apenas eventos que têm anotações relevantes
      return event.payload?.notes ||
             event.type === "closing.approved" ||
             event.type === "closing.rejected" ||
             event.type === "simulation.approved" ||
             event.type === "simulation.rejected" ||
             event.type === "case.observation" ||
             event.type === "simulation.comment";
    });

    const processedNotes = filteredEvents.map((event: any) => ({
      id: event.id,
      content: getEventDescription(event),
      author: event.created_by?.name || "Sistema",
      createdAt: event.created_at,
      module: getEventModule(event.type)
    }));

    console.log('Processed notes:', processedNotes);
    return processedNotes;
  }, [caseEvents]);

  // Função para converter tipo de evento em descrição legível
  function getEventDescription(event: any) {
    const eventTypeMap: Record<string, string> = {
      "case.created": "Caso criado",
      "case.assigned": "Caso atribuído",
      "case.to_calculista": "Enviado ao calculista",
      "simulation.approved": "Simulação aprovada",
      "simulation.rejected": "Simulação rejeitada",
      "closing.approved": "Fechamento aprovado",
      "closing.rejected": "Fechamento rejeitado",
      "case.updated": "Caso atualizado",
      "case.no_contact": "Sem contato",
      "case.reassigned": "Caso reatribuído",
      "case.observation": "Observação do caso",
      "simulation.comment": "Comentário da simulação"
    };

    const description = eventTypeMap[event.type] || event.type;

    // Adicionar informações do payload se disponível
    if (event.payload?.notes) {
      return `${description}: ${event.payload.notes}`;
    }

    return description;
  }

  // Função para determinar o módulo do evento
  function getEventModule(eventType: string) {
    if (eventType.startsWith("closing.")) return "Fechamento";
    if (eventType.startsWith("simulation.")) return "Simulação";
    if (eventType.startsWith("case.")) return "Caso";
    return "Sistema";
  }

  // Funções de manipulação dos botões
  const handleApprove = () => {
    if (showConfirm === 'approve') {
      approve.mutate(caseId, {
        onSuccess: () => {
          router.push('/fechamento');
        }
      });
      setShowConfirm(null);
    } else {
      setShowConfirm('approve');
    }
  };

  const handleReject = () => {
    if (showConfirm === 'reject') {
      reject.mutate(caseId, {
        onSuccess: () => {
          router.push('/fechamento');
        }
      });
      setShowConfirm(null);
    } else {
      setShowConfirm('reject');
    }
  };

  const isActionLoading = approve.isPending || reject.isPending;

  // Funções utilitárias para formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string, mimeType?: string) => {
    if (mimeType?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return <FileImage className="h-4 w-4" />;
    }
    if (mimeType?.includes('pdf') || filename.endsWith('.pdf')) {
      return <File className="h-4 w-4 text-danger" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  // Callback para carregar detalhes completos quando modal abre
  const handleLoadFullDetails = () => {
    if (!selectedCaseId || selectedCaseId !== caseId) {
      setSelectedCaseId(caseId);
    }
  };

  // Função para download de anexos
  const handleDownloadAttachment = (attachmentId: number, filename?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const downloadUrl = `${baseUrl}/cases/${caseId}/attachments/${attachmentId}/download`;
    
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'anexo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para download de anexos do contrato
  const handleDownloadContractAttachment = (contractId: number, attachmentId: number, filename?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const downloadUrl = `${baseUrl}/contracts/${contractId}/attachments/${attachmentId}/download`;
    
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'anexo_contrato';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Caso não encontrado</p>
          <Button onClick={() => router.back()}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">
            Detalhes do Fechamento - Caso #{caseId}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Forçar refresh de todas as queries relacionadas ao caso
              queryClient.invalidateQueries({ queryKey: ["case", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseAttachments", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseEvents", caseId] });
              queryClient.invalidateQueries({ queryKey: ["closingCaseDetails", caseId] });
              // Forçar refetch imediato
              queryClient.refetchQueries({ queryKey: ["case", caseId] });
              toast.success("Dados atualizados!");
            }}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              handleLoadFullDetails();
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </div>

      {/* Botões de Aprovação/Rejeição - Só aparece se status for fechamento_pendente */}
      {caseData.status === "fechamento_pendente" && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Ações do Fechamento</h3>
            <p className="text-sm text-muted-foreground">
              {showConfirm === 'approve' && "Confirme a aprovação do fechamento"}
              {showConfirm === 'reject' && "Confirme a rejeição do fechamento"}
              {!showConfirm && "Escolha uma ação para este fechamento"}
            </p>
          </div>
          <div className="flex gap-2">
            {showConfirm === 'approve' ? (
              <>
                <Button
                   variant="outline"
                   onClick={() => setShowConfirm(null)}
                   disabled={isActionLoading}
                 >
                   Cancelar
                 </Button>
                 <Button
                   onClick={handleApprove}
                   disabled={isActionLoading}
                   className="bg-green-600 hover:bg-green-700"
                 >
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Confirmar Aprovação
                 </Button>
               </>
             ) : showConfirm === 'reject' ? (
               <>
                 <Button
                   variant="outline"
                   onClick={() => setShowConfirm(null)}
                   disabled={isActionLoading}
                 >
                   Cancelar
                 </Button>
                 <Button
                   variant="destructive"
                   onClick={handleReject}
                   disabled={isActionLoading}
                 >
                   <XCircle className="h-4 w-4 mr-2" />
                   Confirmar Rejeição
                 </Button>
               </>
             ) : (
               <>
                 <Button
                   onClick={handleApprove}
                   disabled={isActionLoading}
                   className="bg-green-600 hover:bg-green-700"
                 >
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Aprovar
                 </Button>
                 <Button
                   variant="destructive"
                   onClick={handleReject}
                   disabled={isActionLoading}
                 >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grid de 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna 1: Detalhes do Caso */}
        <div className="lg:col-span-2 space-y-6">
          <CaseDetails
            case={caseData}
            notes={[]} // Removendo as anotações do CaseDetails
            showActions={false}
            hideFinancialInfo={true}
            hideNotesCard={true} // Esconde o card de anotações pois já aparece no histórico
          />

          {/* Informações Financeiras */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Informações Financeiras</h3>
                <p className="text-sm text-muted-foreground">
                  Detalhes da última simulação aprovada
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFinanciamentosModal(true)}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Ver Todos os Financiamentos
              </Button>
            </div>

            {/* Detalhes dos Bancos da Simulação */}
            {caseData.simulation && caseData.simulation.banks && caseData.simulation.banks.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground border-b pb-2">
                  Bancos Usados na Simulação ({caseData.simulation.banks.length})
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {caseData.simulation.banks.map((bank: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                      {/* Nome do Banco */}
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <h5 className="text-sm font-semibold text-foreground">{bank.bank || bank.banco || `Banco ${index + 1}`}</h5>
                        <Badge variant="outline" className="text-xs">
                          Banco {index + 1} de {caseData.simulation.banks.length}
                        </Badge>
                      </div>

                      {/* Grid de Informações */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(bank.saldoDevedor || bank.saldo || 0)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Valor da Parcela</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(bank.parcela || bank.valor_parcela || 0)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Valor Liberado</p>
                          <p className="text-sm font-semibold text-success">
                            {formatCurrency(bank.valorLiberado || bank.valor_liberado || 0)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Quantidade de Parcelas</p>
                          <p className="text-sm font-semibold text-foreground">
                            {bank.parcelas || caseData.simulation.prazo || 0} meses
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais da Simulação */}
                {caseData.simulation.totals && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground mb-3">Resumo Total da Simulação</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-success-subtle border border-success/40 rounded-lg">
                        <p className="text-xs text-success font-medium">Total Liberado</p>
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(caseData.simulation.totals.liberadoTotal)}
                        </p>
                      </div>
                      <div className="p-3 bg-info-subtle border border-info/40 rounded-lg">
                        <p className="text-xs text-info font-medium">Liberado Cliente</p>
                        <p className="text-lg font-bold text-info">
                          {formatCurrency(caseData.simulation.totals.liberadoCliente)}
                        </p>
                      </div>
                      <div className="p-3 bg-accent-subtle border border-accent/40 rounded-lg">
                        <p className="text-xs text-accent font-medium">Consultoria Líquida</p>
                        <p className="text-lg font-bold text-accent">
                          {formatCurrency(caseData.simulation.totals.custoConsultoriaLiquido || (caseData.simulation.totals.custoConsultoria * 0.86))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Nenhuma simulação aprovada encontrada</p>
                <p className="text-xs text-muted-foreground">
                  Os detalhes da simulação aparecerão aqui quando disponíveis
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Coluna 2: Simulação Aprovada */}
        <div className="lg:col-span-1 space-y-6">
          {caseData.simulation && caseData.simulation.status === "approved" && (
            <SimulationResultCard
              totals={{
                valorParcelaTotal: caseData.simulation.totals?.valorParcelaTotal || 0,
                saldoTotal: caseData.simulation.totals?.saldoTotal || 0,
                liberadoTotal: caseData.simulation.totals?.liberadoTotal || 0,
                seguroObrigatorio: caseData.simulation.totals?.seguroObrigatorio || 0,
                totalFinanciado: caseData.simulation.totals?.totalFinanciado || 0,
                valorLiquido: caseData.simulation.totals?.valorLiquido || 0,
                custoConsultoria: caseData.simulation.totals?.custoConsultoria || 0,
                custoConsultoriaLiquido: caseData.simulation.totals?.custoConsultoriaLiquido || (caseData.simulation.totals?.custoConsultoria || 0) * 0.86,
                liberadoCliente: caseData.simulation.totals?.liberadoCliente || 0
              }}
              simulation={{
                banks: caseData.simulation.banks || [],
                prazo: caseData.simulation.prazo || 0,
                coeficiente: "",
                seguro: caseData.simulation.totals?.seguroObrigatorio || 0,
                percentualConsultoria: caseData.simulation.percentualConsultoria || 0
              }}
            />
          )}

          {/* Anexos do Caso */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Anexos do Caso</h3>
              {attachments && attachments.length > 0 && (
                <span className="text-sm text-muted-foreground">({attachments.length})</span>
              )}
            </div>

            {attachmentsLoading ? (
              <div className="text-center py-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(attachment.filename, attachment.mime)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {attachment.filename}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(attachment.size)}</span>
                          <span>•</span>
                          <span>
                            {formatDate(attachment.uploaded_at || attachment.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                      className="flex items-center gap-2 shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Nenhum anexo encontrado</p>
                <p className="text-xs text-muted-foreground">
                  Os anexos do caso aparecerão aqui quando disponíveis
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Chat do Fechamento - Full Width */}
      <CaseChat caseId={caseId} defaultChannel="FECHAMENTO" />

      {/* Histórico do Caso */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Histórico do Atendimento</h2>
        {caseEvents && caseEvents.length > 0 ? (
          <div className="space-y-4">
            {caseEvents.map((event: any) => (
              <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary"></div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {event.type === 'case.created' && '📋 Caso criado'}
                        {event.type === 'case.assigned' && '👤 Caso atribuído'}
                        {event.type === 'case.status_changed' && '🔄 Status alterado'}
                        {event.type === 'case.updated' && '✏️ Caso atualizado'}
                        {event.type === 'attachment.added' && '📎 Anexo adicionado'}
                        {event.type === 'attachment.deleted' && '🗑️ Anexo removido'}
                        {event.type === 'simulation.created' && '📊 Simulação criada'}
                        {event.type === 'simulation.approved' && '✅ Simulação aprovada'}
                        {event.type === 'simulation.rejected' && '❌ Simulação rejeitada'}
                        {event.type === 'closing.approved' && '✅ Fechamento aprovado'}
                        {event.type === 'closing.rejected' && '❌ Fechamento rejeitado'}
                        {event.type === 'case.sent_to_calculista' && '🧮 Enviado para calculista'}
                        {event.type === 'case.to_calculista' && '🧮 Enviado ao calculista'}
                        {event.type === 'case.observation' && '📝 Observação do caso'}
                        {event.type === 'simulation.comment' && '💬 Comentário da simulação'}
                        {!['case.created', 'case.assigned', 'case.status_changed', 'case.updated', 'attachment.added', 'attachment.deleted', 'simulation.created', 'simulation.approved', 'simulation.rejected', 'closing.approved', 'closing.rejected', 'case.sent_to_calculista', 'case.to_calculista', 'case.observation', 'simulation.comment'].includes(event.type) && `📌 ${event.type}`}
                      </span>
                      {event.created_by && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {event.created_by.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {event.payload.filename && `Arquivo: ${event.payload.filename}`}
                      {event.payload.status && `Novo status: ${event.payload.status}`}
                      {event.payload.assigned_to && `Atribuído para: ${event.payload.assigned_to}`}
                      {event.payload.deleted_by && `Removido por: ${event.payload.deleted_by}`}
                      {event.payload.notes && `${event.payload.notes}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum evento registrado ainda
          </div>
        )}
      </Card>

      {/* Modal de Detalhes Completo com Abas */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento #{caseId}</DialogTitle>
          </DialogHeader>

          {fullCaseDetails ? (
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="client">Cliente</TabsTrigger>
                <TabsTrigger value="simulation">Simulação</TabsTrigger>
                <TabsTrigger value="contract">Contrato</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>

              {/* Aba Cliente */}
              <TabsContent value="client" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <p className="font-medium">{fullCaseDetails.client.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">CPF</span>
                    <p className="font-medium">{fullCaseDetails.client.cpf}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Matrícula</span>
                    <p className="font-medium">{fullCaseDetails.client.matricula}</p>
                  </div>
                  {fullCaseDetails.client.orgao && (
                    <div>
                      <span className="text-sm text-muted-foreground">Órgão</span>
                      <p className="font-medium">{fullCaseDetails.client.orgao}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.telefone_preferencial && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone</span>
                      <p className="font-medium">{fullCaseDetails.client.telefone_preferencial}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.banco && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">Banco</span>
                        <p className="font-medium">{fullCaseDetails.client.banco}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Agência</span>
                        <p className="font-medium">{fullCaseDetails.client.agencia}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Conta</span>
                        <p className="font-medium">{fullCaseDetails.client.conta}</p>
                      </div>
                    </>
                  )}
                  {fullCaseDetails.client.chave_pix && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Chave PIX ({fullCaseDetails.client.tipo_chave_pix})</span>
                      <p className="font-medium">{fullCaseDetails.client.chave_pix}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.observacoes && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Observações</span>
                      <p className="font-medium">{fullCaseDetails.client.observacoes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba Simulação */}
              <TabsContent value="simulation" className="space-y-4">
                {fullCaseDetails.simulation ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-lg border border-success/40 bg-success-subtle p-3">
                        <span className="text-xs font-medium text-success">Valor Liberado</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.liberadoTotal)}</p>
                      </div>
                      <div className="rounded-lg border border-info/40 bg-info-subtle p-3">
                        <span className="text-xs font-medium text-info">Liberado Cliente</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.liberadoCliente)}</p>
                      </div>
                      <div className="rounded-lg border border-accent/40 bg-accent-subtle p-3">
                        <span className="text-xs font-medium text-accent">Valor Parcela</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.valorParcelaTotal)}</p>
                      </div>
                      <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3">
                        <span className="text-xs font-medium text-warning">Prazo</span>
                        <p className="font-bold">{fullCaseDetails.simulation.prazo} meses</p>
                      </div>
                    </div>

                    {/* Botão de Impressão */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir Simulação
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Total Financiado</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.totalFinanciado)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Custo Consultoria</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.custoConsultoria)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Consultoria Líquida (86%)</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.custoConsultoriaLiquido)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Seguro Obrigatório</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.seguro)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Coeficiente</span>
                        <p className="font-medium font-mono">{fullCaseDetails.simulation.coeficiente}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">% Consultoria</span>
                        <p className="font-medium">{fullCaseDetails.simulation.percentual_consultoria}%</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma simulação encontrada</p>
                )}
              </TabsContent>

              {/* Aba Contrato */}
              <TabsContent value="contract" className="space-y-4">
                {fullCaseDetails.contract ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Valor Total</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.contract.total_amount)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Parcelas</span>
                        <p className="font-medium">{fullCaseDetails.contract.installments}x</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data Liberação</span>
                        <p className="font-medium">{fullCaseDetails.contract.disbursed_at ? formatDate(fullCaseDetails.contract.disbursed_at) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="font-medium capitalize">{fullCaseDetails.contract.status}</p>
                      </div>
                    </div>
                    {fullCaseDetails.contract.attachments && fullCaseDetails.contract.attachments.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="font-semibold">Anexos do Contrato ({fullCaseDetails.contract.attachments.length})</h4>
                        {fullCaseDetails.contract.attachments.map((att: any) => (
                          <div key={att.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center gap-2">
                              {getFileIcon(att.filename, att.mime)}
                              <div>
                                <p className="text-sm font-medium">{att.filename}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadContractAttachment(fullCaseDetails.contract.id, att.id, att.filename)}
                              title="Baixar anexo do contrato"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Contrato ainda não efetivado</p>
                )}
              </TabsContent>

              {/* Aba Histórico - Mostra TODAS as anotações do atendente */}
              <TabsContent value="history">
                <CaseHistory events={fullCaseDetails.events} />
              </TabsContent>

              {/* Aba Anexos */}
              <TabsContent value="attachments" className="space-y-2">
                {fullCaseDetails.attachments.length > 0 ? (
                  fullCaseDetails.attachments.map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        {getFileIcon(att.path, att.mime)}
                        <div>
                          <p className="text-sm font-medium">{att.filename || att.path.split('/').pop()}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(att.size)} • {formatDate(att.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadAttachment(att.id, att.filename)}
                        title="Baixar anexo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum anexo do caso</p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4 py-8">
              <div className="text-center text-muted-foreground">
                <p>Carregando detalhes...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Financiamentos */}
      <FinanciamentosModal
        isOpen={showFinanciamentosModal}
        onClose={() => setShowFinanciamentosModal(false)}
        clientId={caseData?.client?.id || 0}
        clientName={caseData?.client?.name}
      />

      {/* Modal de Histórico */}
      <SimulationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={simulationHistory || []}
        caseId={caseId}
        clientName={caseData?.client?.name}
        showEditButton={false}
        onEditSimulation={() => {
          // Fechamento não permite edição
        }}
      />
    </div>
  );
}
