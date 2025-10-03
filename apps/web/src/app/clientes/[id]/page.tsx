"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SimulationHistoryModal } from "@lifecalling/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, User, FileText, Calendar, DollarSign, Building, Hash, History, Eye, Trash2 } from "lucide-react";
import Financiamentos from "@/components/clients/Financiamentos";
import { Snippet } from "@nextui-org/snippet";

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: client, isLoading } = useQuery({
    queryKey: ["/clients", id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Buscar casos do cliente
  const { data: clientCases, error: casesError, isLoading: casesLoading } = useQuery({
    queryKey: ["/cases/client", id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}/cases`);
      return response.data.items || [];
    },
    enabled: !!id,
  });

  // Buscar histórico de simulações do caso selecionado
  const { data: simulationHistory } = useQuery({
    queryKey: ["simulationHistory", selectedCaseId],
    queryFn: async () => {
      const response = await api.get(`/simulations/${selectedCaseId}/history`);
      return response.data?.items || [];
    },
    enabled: !!selectedCaseId && showHistoryModal
  });

  // Buscar todos os anexos de todos os casos do cliente
  const { data: allAttachments } = useQuery({
    queryKey: ["clientAttachments", id],
    queryFn: async () => {
      if (!clientCases || clientCases.length === 0) return [];

      // Buscar anexos de cada caso
      const attachmentPromises = clientCases.map(async (caso: any) => {
        try {
          const response = await api.get(`/cases/${caso.id}/attachments`);
          return {
            caseId: caso.id,
            caseStatus: caso.status,
            attachments: response.data || []
          };
        } catch (error) {
          console.error(`Erro ao buscar anexos do caso ${caso.id}:`, error);
          return {
            caseId: caso.id,
            caseStatus: caso.status,
            attachments: []
          };
        }
      });

      const results = await Promise.all(attachmentPromises);
      // Filtrar apenas casos que têm anexos
      return results.filter(r => r.attachments.length > 0);
    },
    enabled: !!id && !!clientCases && clientCases.length > 0
  });

  // Buscar contratos efetivados do cliente
  const { data: contratosData } = useQuery({
    queryKey: ["clientContracts", id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}/contratos-efetivados`);
      return response.data;
    },
    enabled: !!id
  });

  const contratos = contratosData?.items || [];

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  // Mutation para deletar cliente
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await api.delete(`/clients/${clientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/clients"] });
      toast.success("Cliente excluído com sucesso!");
      router.push("/clientes");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "Erro ao excluir cliente";
      toast.error(errorMessage);
    }
  });

  const handleDeleteClient = () => {
    if (confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      deleteClientMutation.mutate(parseInt(id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { color: "bg-green-100 text-green-800", label: "Ativo" },
      encerrado: { color: "bg-gray-100 text-gray-800", label: "Encerrado" },
      inadimplente: { color: "bg-red-100 text-red-800", label: "Inadimplente" },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Cliente não encontrado</h3>
          <p className="text-muted-foreground mb-4">
            O cliente solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.nome}</h1>
            <p className="text-muted-foreground">Detalhes do cliente</p>
          </div>
        </div>
        {user?.role === "admin" && (
          <Button
            variant="destructive"
            onClick={handleDeleteClient}
            disabled={deleteClientMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteClientMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
          </Button>
        )}
      </div>

      {/* Informações do Cliente */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações Pessoais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">CPF</label>
            <Snippet
              symbol=""
              copyIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              }
              classNames={{
                base: "w-full bg-muted",
                pre: "text-sm font-mono"
              }}
              style={{ borderRadius: "var(--radius)" }}
              onCopy={() => {
                // Copiar apenas números (sem pontos e hífens)
                const cpfNumeros = client.cpf.replace(/\D/g, '');
                navigator.clipboard.writeText(cpfNumeros);
              }}
            >
              {formatCPF(client.cpf)}
            </Snippet>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Matrícula</label>
            <Snippet
              symbol=""
              copyIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              }
              classNames={{
                base: "w-full bg-muted",
                pre: "text-sm font-mono"
              }}
              style={{ borderRadius: "var(--radius)" }}
              onCopy={() => {
                // Copiar apenas números e letras (sem hífens)
                const matriculaSemFormatacao = client.matricula.replace(/[^a-zA-Z0-9]/g, '');
                navigator.clipboard.writeText(matriculaSemFormatacao);
              }}
            >
              {client.matricula}
            </Snippet>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Órgão</label>
            <p className="text-lg">{client.orgao || "—"}</p>
          </div>
        </div>

        {client.created_at && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Importado em {new Date(client.created_at).toLocaleDateString('pt-BR')} às {new Date(client.created_at).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        )}
      </Card>

      {/* Contratos */}
      <Financiamentos clientId={parseInt(id)} />

      {/* Casos do Cliente */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Casos e Atendimentos
        </h2>

        {casesLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
          </div>
        ) : casesError ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-red-500">Erro ao carregar casos: {(casesError as any)?.message}</p>
          </div>
        ) : !clientCases || clientCases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum caso encontrado para este cliente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientCases.map((caso: any) => (
              <div
                key={caso.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono">
                      Caso #{caso.id}
                    </Badge>
                    {caso.matricula && (
                      <Badge variant="secondary" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {caso.matricula}
                      </Badge>
                    )}
                    <StatusBadge status={caso.status} size="sm" />
                    {caso.assigned_to && (
                      <span className="text-sm text-muted-foreground">
                        Atendente: {caso.assigned_to}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Criado em {new Date(caso.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCaseId(caso.id);
                      setShowHistoryModal(true);
                    }}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/casos/${caso.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contratos Efetivados */}
      {contratos && contratos.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Contratos Efetivados ({contratos.length})
          </h2>

          <div className="space-y-4">
            {contratos.map((contrato: any) => (
              <div
                key={contrato.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      Contrato #{contrato.id}
                    </Badge>
                    <Badge variant={contrato.status === "ativo" ? "default" : "secondary"}>
                      {contrato.status === "ativo" ? "Ativo" : contrato.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor Total</p>
                      <p className="font-semibold">{formatCurrency(contrato.total_amount.toString())}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parcelas</p>
                      <p className="font-semibold">{contrato.paid_installments}/{contrato.installments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consultoria Líquida</p>
                      <p className="font-semibold">{formatCurrency(contrato.consultoria_valor_liquido.toString())}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Efetivação</p>
                      <p className="font-semibold">
                        {contrato.disbursed_at ? new Date(contrato.disbursed_at).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>

                  {contrato.attachments && contrato.attachments.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        {contrato.attachments.length} {contrato.attachments.length === 1 ? 'anexo' : 'anexos'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contrato.attachments.map((att: any) => (
                          <Badge key={att.id} variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {att.filename}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/casos/${contrato.case_id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Caso
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Anexos de Todos os Casos */}
      {allAttachments && allAttachments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anexos de Todos os Casos ({allAttachments.reduce((acc, c) => acc + c.attachments.length, 0)})
          </h2>

          <div className="space-y-6">
            {allAttachments.map((caseData: any) => (
              <div key={caseData.caseId} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Badge variant="outline" className="font-mono">
                    Caso #{caseData.caseId}
                  </Badge>
                  <StatusBadge status={caseData.caseStatus} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {caseData.attachments.length} {caseData.attachments.length === 1 ? 'anexo' : 'anexos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseData.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 rounded border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={attachment.filename}>
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                            {attachment.uploaded_at && (
                              <> • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/casos/${caseData.caseId}`)}
                        title="Ver caso"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de Histórico de Simulações */}
      <SimulationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedCaseId(null);
        }}
        history={simulationHistory || []}
        caseId={selectedCaseId || undefined}
        clientName={client?.nome}
        onEditSimulation={() => {
          // Cliente não permite edição
        }}
      />
    </div>
  );
}