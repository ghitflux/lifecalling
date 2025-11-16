"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, type Status, SimulationResultCard, DetailsSkeleton } from "@lifecalling/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSendToCalculista, useReassignCase, useUsers, useAttachments, useDeleteAttachment, useClientPhones, useAddClientPhone, useDeleteClientPhone, useCaseEvents, useMarkNoContact, useSendToFechamento, useAssignCase, useReturnToPipeline } from "@/lib/hooks";
import { formatPhone, unformatPhone } from "@/lib/masks";
import { Calendar, Database } from "lucide-react";
import AttachmentUploader from "@/components/cases/AttachmentUploader";
import { Snippet } from "@nextui-org/snippet";
import { RefreshCw, ArrowLeft } from "lucide-react";
import CaseChat from "@/components/case/CaseChat";
import AdminStatusChanger from "@/components/case/AdminStatusChanger";
import { getComments } from "@/lib/comments";

interface CaseDetail {
  id: number;
  status: string;
  assigned_to?: string;
  assigned_user_id?: number;
  assignment_expires_at?: string;
  client: {
    id: number;
    name: string;
    cpf: string;
    matricula: string;
    orgao: string;
    telefone_preferencial?: string;
    numero_cliente?: string;
    observacoes?: string;
    // Dados bancários
    banco?: string;
    agencia?: string;
    conta?: string;
    chave_pix?: string;
    tipo_chave_pix?: string;
    // Dados de financiamento do módulo cliente
    financiamentos?: Array<{
      id: number;
      matricula: string;  // Matrícula do financiamento
      financiamento_code: string;
      total_parcelas: number;
      parcelas_pagas: number;
      valor_parcela_ref: string;
      orgao_pagamento: string;
      orgao_pagamento_nome?: string;
      entity_name: string;
      status_code: string;
      status_description: string;
      referencia?: string;
      ref_month?: number;
      ref_year?: number;
      created_at?: string;
    }>;
  };
  simulation?: {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    // Novos campos (formato atualizado)
    totals?: {
      valorParcelaTotal: number;
      saldoTotal: number;
      liberadoTotal: number;
      seguroObrigatorio?: number; // Valor do seguro obrigatório
      totalFinanciado: number;
      valorLiquido: number;
      custoConsultoria: number;
      custoConsultoriaLiquido?: number; // Custo líquido da consultoria (86%)
      liberadoCliente: number;
    };
    banks?: Array<{
      bank: string;
      parcela: number;
      saldoDevedor: number;
      valorLiberado: number;
    }>;
    prazo?: number;
    percentualConsultoria?: number;
    // Campos legados (manter compatibilidade)
    results?: {
      valorLiberado: number;
      valorParcela: number;
      taxaJuros: number;
      prazo: number;
    };
    created_at: string;
    updated_at?: string;
  };
  attachments?: Array<{
    id: number;
    filename: string;
    size: number;
    uploaded_at: string;
  }>;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [telefone, setTelefone] = useState("");
  const [numeroCliente, setNumeroCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [sentToCalculista, setSentToCalculista] = useState(false);

  // Estados para dados bancários
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("cpf");

  // Hook para enviar para calculista
  const sendCalc = useSendToCalculista();

  // Hook para reatribuir caso (apenas admin/supervisor)
  const reassign = useReassignCase();

  // Hook para marcar sem contato
  const markNoContact = useMarkNoContact();

  // Hook para devolver para esteira
  const returnToPipeline = useReturnToPipeline();

  // Hook para enviar para fechamento
  const sendToFechamento = useSendToFechamento();

  // Hook para pegar caso
  const assignCase = useAssignCase();

  // Hook para listar usuários ativos
  const { data: users } = useUsers();

  // Query para buscar detalhes do caso (DEVE VIR ANTES de usar caseDetail)
  const { data: caseDetail, isLoading, error } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      try {
        console.log(`[CaseDetails] Fetching case ${caseId}...`);
        const response = await api.get(`/cases/${caseId}`);
        console.log(`[CaseDetails] Successfully fetched case ${caseId}:`, response.data);
        return response.data as CaseDetail;
      } catch (error: any) {
        console.error(`[CaseDetails] Error fetching case ${caseId}:`, error);
        
        // Log detalhado do erro
        if (error.response) {
          console.error(`[CaseDetails] Response status: ${error.response.status}`);
          console.error(`[CaseDetails] Response data:`, error.response.data);
          console.error(`[CaseDetails] Response headers:`, error.response.headers);
        } else if (error.request) {
          console.error(`[CaseDetails] Request error:`, error.request);
        } else {
          console.error(`[CaseDetails] General error:`, error.message);
        }
        
        if (error.response?.status === 401) {
          console.error(`[CaseDetails] Authentication error - redirecting to login`);
          toast.error("Você precisa estar logado para ver os detalhes do caso");
          // Redirecionar para login
          window.location.href = '/login';
          throw error;
        }
        
        if (error.response?.status === 403) {
          console.error(`[CaseDetails] Permission denied for case ${caseId}`);
          toast.error("Você não tem permissão para ver este caso");
          throw error;
        }
        
        if (error.response?.status === 404) {
          console.error(`[CaseDetails] Case ${caseId} not found`);
          toast.error("Caso não encontrado");
          throw error;
        }
        
        // Erro genérico com mais detalhes
        const errorMessage = error.response?.data?.detail || error.message || "Erro desconhecido";
        console.error(`[CaseDetails] Generic error: ${errorMessage}`);
        toast.error(`Erro ao carregar detalhes do caso: ${errorMessage}`);
        throw error;
      }
    },
    enabled: !!caseId,
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros de auth ou permissão
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Tentar até 2 vezes para outros erros
      return failureCount < 2;
    },
  });

  // Buscar endereços do cliente
  const { data: clientAddresses = [] } = useQuery({
    queryKey: ["clientAddresses", caseDetail?.client?.id],
    queryFn: async () => {
      if (!caseDetail?.client?.id) return [];
      const response = await api.get(`/clients/${caseDetail.client.id}/addresses`);
      return response.data;
    },
    enabled: !!caseDetail?.client?.id
  });

  // Identificar o financiamento mais recente
  const mostRecentFinanciamentoId = useMemo(() => {
    if (!caseDetail?.client?.financiamentos?.length) return null;
    const withDates = caseDetail.client.financiamentos.filter(f => f.created_at);
    if (!withDates.length) return null;

    return withDates.reduce((most, current) => {
      const mostDate = new Date(most.created_at!);
      const currentDate = new Date(current.created_at!);
      return currentDate > mostDate ? current : most;
    }).id;
  }, [caseDetail?.client?.financiamentos]);

  // Hook para carregar anexos do caso
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(caseId);

  // Hook para deletar anexos
  const deleteAttachment = useDeleteAttachment();

  // Hooks para telefones do cliente (agora seguro usar caseDetail)
  const clientId = caseDetail?.client?.id;
  const { data: clientPhones = [] } = useClientPhones(clientId || 0);
  const addPhone = useAddClientPhone();
  const deletePhone = useDeleteClientPhone();

  // Hook para eventos do caso
  const { data: caseEvents = [] } = useCaseEvents(caseId);

  // Query para comentários do caso
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", caseId],
    queryFn: () => getComments(caseId),
    enabled: !!caseId
  });

  const handleSendToCalculista = async () => {
    try {
      setSentToCalculista(true);
      await sendCalc.mutateAsync(caseId);
      toast.success("Caso enviado para calculista com sucesso!");
      // Redirecionar para a esteira, aba "Meus Atendimentos"
      setTimeout(() => {
        window.location.href = "/esteira";
      }, 1000);
    } catch (error) {
      setSentToCalculista(false);
      toast.error("Erro ao enviar para calculista. Tente novamente.");
    }
  };

  const handleMarkNoContact = async () => {
    try {
      await markNoContact.mutateAsync(caseId);
    } catch (error) {
      console.error("Erro ao marcar sem contato:", error);
    }
  };

  const handleReturnToPipeline = async () => {
    try {
      // Validar condições antes de chamar a API
      if (!attachments || attachments.length < 1) {
        toast.error("É necessário pelo menos 1 anexo para devolver o caso para a esteira");
        return;
      }

      if (!clientPhones || clientPhones.length < 1) {
        toast.error("É necessário pelo menos 1 telefone registrado para o cliente para devolver o caso para a esteira");
        return;
      }

      if (!currentUserId) {
        toast.error("Erro: usuário não identificado");
        return;
      }

      const userComments = comments.filter(c => c.author_id === currentUserId);
      if (userComments.length < 1) {
        toast.error("É necessário pelo menos 1 comentário do usuário proprietário para devolver o caso para a esteira");
        return;
      }

      await returnToPipeline.mutateAsync(caseId);
    } catch (error) {
      console.error("Erro ao devolver para esteira:", error);
    }
  };

  const handleSendToFechamento = async () => {
    try {
      await sendToFechamento.mutateAsync(caseId);
    } catch (error) {
      console.error("Erro ao enviar para fechamento:", error);
    }
  };

  const handleAssignCase = async () => {
    try {
      await assignCase.mutateAsync(caseId);
      toast.success("Caso atribuído com sucesso!");
      // Recarregar dados do caso
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    } catch (error) {
      console.error("Erro ao pegar caso:", error);
      toast.error("Erro ao pegar caso. Tente novamente.");
    }
  };

  // Buscar role do usuário atual
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get("/auth/me");
        setUserRole(response.data.role);
        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Erro ao buscar role do usuário:", error);
      }
    };
    fetchUserRole();
  }, []);

  // Atualiza os campos quando os dados chegam
  useEffect(() => {
    if (caseDetail) {
      setTelefone(formatPhone(caseDetail.client.telefone_preferencial || ""));
      setNumeroCliente(caseDetail.client.numero_cliente || "");
      setObservacoes(caseDetail.client.observacoes || "");
      setBanco(caseDetail.client.banco || "");
      setAgencia(caseDetail.client.agencia || "");
      setConta(caseDetail.client.conta || "");
      setChavePix(caseDetail.client.chave_pix || "");
      setTipoChavePix(caseDetail.client.tipo_chave_pix || "cpf");
      setSelectedAssignee(caseDetail.assigned_user_id?.toString() || "");
    }
  }, [caseDetail]);

  // Mutation para atualizar caso
  const updateCaseMutation = useMutation({
    mutationFn: async (data: {
      telefone_preferencial?: string;
      numero_cliente?: string;
      observacoes?: string;
      banco?: string;
      agencia?: string;
      conta?: string;
      chave_pix?: string;
      tipo_chave_pix?: string;
    }) => {
      const response = await api.patch(`/cases/${caseId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId, "events"] });
      toast.success("Alterações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar alterações");
    },
  });


  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  const handleReassign = async () => {
    if (!selectedAssignee) {
      toast.error("Selecione um atendente");
      return;
    }

    try {
      await reassign.mutateAsync({
        caseId,
        assigneeId: parseInt(selectedAssignee)
      });
    } catch (error) {
      console.error("Erro ao reatribuir:", error);
    }
  };

  const handleSave = () => {
    const updates: {
      telefone_preferencial?: string;
      numero_cliente?: string;
      observacoes?: string;
      banco?: string;
      agencia?: string;
      conta?: string;
      chave_pix?: string;
      tipo_chave_pix?: string;
    } = {};

    const unformattedPhone = unformatPhone(telefone);
    if (unformattedPhone !== (caseDetail?.client.telefone_preferencial || "")) {
      updates.telefone_preferencial = unformattedPhone;
    }
    if (numeroCliente !== (caseDetail?.client.numero_cliente || "")) {
      updates.numero_cliente = numeroCliente;
    }
    if (observacoes !== (caseDetail?.client.observacoes || "")) {
      updates.observacoes = observacoes;
    }
    if (banco !== (caseDetail?.client.banco || "")) {
      updates.banco = banco;
    }
    if (agencia !== (caseDetail?.client.agencia || "")) {
      updates.agencia = agencia;
    }
    if (conta !== (caseDetail?.client.conta || "")) {
      updates.conta = conta;
    }
    if (chavePix !== (caseDetail?.client.chave_pix || "")) {
      updates.chave_pix = chavePix;
    }
    if (tipoChavePix !== (caseDetail?.client.tipo_chave_pix || "cpf")) {
      updates.tipo_chave_pix = tipoChavePix;
    }

    if (Object.keys(updates).length > 0) {
      updateCaseMutation.mutate(updates);
    }
  };


  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Erro ao carregar detalhes do atendimento</div>
          <div className="text-sm text-gray-500">
            {(error as any).response?.status === 401
              ? "Você precisa estar logado para ver este conteúdo"
              : "Tente novamente mais tarde"}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Erro ao carregar detalhes do atendimento
          </div>
          <div className="text-gray-600 mb-4">
            {error?.response?.status === 401 && "Você precisa estar logado para ver os detalhes do caso"}
            {error?.response?.status === 403 && "Você não tem permissão para ver este caso"}
            {error?.response?.status === 404 && "Caso não encontrado"}
            {error?.response?.status === 500 && "Erro interno do servidor"}
            {!error?.response?.status && "Erro de conexão - verifique sua internet"}
            {error?.response?.status && error?.response?.status >= 400 && error?.response?.status < 500 && !error?.response?.status.toString().startsWith("4") && 
              `Erro ${error.response.status}: ${error.response?.data?.detail || "Erro desconhecido"}`}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!caseDetail) {
    if (isLoading) {
      return <DetailsSkeleton />;
    }
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">Atendimento não encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Admin Status Changer (apenas para admin) - Movido para o topo */}
      <AdminStatusChanger caseId={caseId} currentStatus={caseDetail?.status || ''} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Debug: verificar todo o sessionStorage
              console.log('Todo o sessionStorage:', {
                'esteira-page': sessionStorage.getItem('esteira-page'),
                'esteira-tab': sessionStorage.getItem('esteira-tab'),
                'esteira-filters': sessionStorage.getItem('esteira-filters')
              });

              // Verificar se há parâmetros de paginação salvos no sessionStorage
              const savedPage = sessionStorage.getItem('esteira-page');
              const savedTab = sessionStorage.getItem('esteira-tab');
              const savedFilters = sessionStorage.getItem('esteira-filters');

              console.log('Dados salvos no sessionStorage:', { savedPage, savedTab, savedFilters });

              if (savedPage && savedTab && savedTab === 'global') {
                // Construir URL com parâmetros salvos
                const params = new URLSearchParams();
                params.set('page', savedPage);
                params.set('tab', savedTab);

                if (savedFilters) {
                  try {
                    const filters = JSON.parse(savedFilters);
                    if (filters.status && filters.status.length > 0) {
                      params.set('status', filters.status.join(','));
                    }
                    if (filters.search) {
                      params.set('search', filters.search);
                    }
                  } catch (e) {
                    console.warn('Erro ao parsear filtros salvos:', e);
                  }
                }

                console.log('Navegando com parâmetros:', params.toString());
                router.push(`/esteira?${params.toString()}`);
              } else {
                // Fallback para a esteira padrão (global)
                console.log('Navegando para global (fallback)');
                router.push('/esteira');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retornar à Esteira
          </Button>

          {/* Botão Pegar Caso - aparece apenas em casos novos e não atribuídos */}
          {caseDetail.status === 'novo' &&
           !caseDetail.assigned_user_id &&
           ['atendente', 'admin', 'supervisor'].includes(userRole) && (
            <Button
              variant="default"
              onClick={handleAssignCase}
              disabled={assignCase.isPending}
              className="flex items-center gap-2"
            >
              {assignCase.isPending ? "Pegando..." : "Pegar Este Caso"}
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold">Atendimento #{caseDetail.id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={caseDetail.status as Status} />
              {caseDetail.assigned_to && (
                <span className="text-sm text-muted-foreground">
                  Atribuído a: <strong>{caseDetail.assigned_to}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Forçar refresh de todas as queries relacionadas ao caso
              queryClient.invalidateQueries({ queryKey: ["case", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseAttachments", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseEvents", caseId] });
              queryClient.invalidateQueries({ queryKey: ["clientPhones", caseDetail?.client?.id] });
              // Forçar refetch imediato
              queryClient.refetchQueries({ queryKey: ["case", caseId] });
              toast.success("Dados atualizados!");
            }}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* Botão Devolver para Esteira - aparece apenas para o proprietário do caso */}
          {caseDetail.assigned_user_id === currentUserId && 
           caseDetail.status !== "novo" && (
            <Button
              variant="secondary"
              onClick={handleReturnToPipeline}
              disabled={returnToPipeline.isPending}
            >
              {returnToPipeline.isPending ? "Devolvendo..." : "Devolver para Esteira"}
            </Button>
          )}
          {/* Botão Sem Contato - aparece apenas quando não é o proprietário ou caso já está novo */}
          {(!caseDetail.assigned_user_id || 
            caseDetail.assigned_user_id !== currentUserId || 
            caseDetail.status === "novo") && (
            <Button
              variant="secondary"
              onClick={handleMarkNoContact}
              disabled={markNoContact.isPending}
            >
              {markNoContact.isPending ? "Marcando..." : "Sem Contato"}
            </Button>
          )}
          {caseDetail.status === "calculo_aprovado" && (
            <Button
              onClick={handleSendToFechamento}
              disabled={sendToFechamento.isPending}
              variant="default"
            >
              {sendToFechamento.isPending ? "Enviando..." : "Enviar para Fechamento"}
            </Button>
          )}
          <Button
            onClick={handleSendToCalculista}
            disabled={
              sendCalc.isPending || 
              sentToCalculista || 
              caseDetail.status !== "em_atendimento" ||
              (caseDetail.status === "em_atendimento" && (!attachments || attachments.length === 0))
            }
            title={
              caseDetail.status !== "em_atendimento" 
                ? "O caso deve estar em atendimento para ser enviado para simulação"
                : (caseDetail.status === "em_atendimento" && (!attachments || attachments.length === 0)) 
                  ? "É necessário anexar pelo menos um contracheque para enviar para simulação" 
                  : ""
            }
          >
            {sentToCalculista ? "Enviado para Simulação" : sendCalc.isPending ? "Enviando..." : "Enviar para Calculista"}
          </Button>
        </div>
      </div>

      {/* Reatribuir Caso (apenas admin/supervisor) */}
      {(userRole === "admin" || userRole === "supervisor") && users && users.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label>Reatribuir para outro atendente</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atendente" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u: any) => u.active)
                    .map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleReassign}
              disabled={reassign.isPending || !selectedAssignee}
              className="mt-6"
            >
              {reassign.isPending ? "Reatribuindo..." : "Reatribuir"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna 1: Dados do Cliente */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Dados do Cliente</h2>

          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={caseDetail.client.name} disabled />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">CPF</Label>
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
                    const cpfNumeros = caseDetail.client.cpf.replace(/\D/g, '');
                    navigator.clipboard.writeText(cpfNumeros);
                  }}
                >
                  {caseDetail.client.cpf}
                </Snippet>
              </div>
              <div>
                <Label className="mb-2 block">Matrícula</Label>
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
                    const matriculaSemFormatacao = caseDetail.client.matricula.replace(/[^a-zA-Z0-9]/g, '');
                    navigator.clipboard.writeText(matriculaSemFormatacao);
                  }}
                >
                  {caseDetail.client.matricula}
                </Snippet>
              </div>
            </div>

            {/* Informações Financeiras do Cliente */}
            {caseDetail.client.financiamentos && caseDetail.client.financiamentos.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Informações Financeiras ({caseDetail.client.financiamentos.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {caseDetail.client.financiamentos.map((fin) => {
                    // Construir referência se não existir
                    const referencia = fin.referencia || (fin.ref_month && fin.ref_year ? `${String(fin.ref_month).padStart(2, '0')}/${fin.ref_year}` : null);
                    const isMostRecent = fin.id === mostRecentFinanciamentoId;

                    return (
                      <div
                        key={fin.id}
                        className={'rounded-lg border p-4 text-sm space-y-3 ' + (isMostRecent ? 'border-success/60 bg-success/5' : 'border-border/40 bg-muted/40')}
                      >
                        {isMostRecent && (
                          <div className="pb-2 -m-4 mb-0 p-3 rounded-t-lg bg-success/10 border-b border-success/30">
                            <div className="flex items-center gap-2">
                              <Database className="h-3.5 w-3.5 text-success" />
                              <div className="text-xs font-medium text-success">Importação mais recente</div>
                            </div>
                          </div>
                        )}
                        {fin.matricula && fin.matricula !== caseDetail.client.matricula && (
                          <div className="pb-2 border-b border-warning/30 bg-warning/5 -m-4 mb-0 p-3 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                              </svg>
                              <div className="text-xs font-medium text-warning">Matrícula diferente: {fin.matricula}</div>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div><div className="text-xs text-muted-foreground">Status do Financiamento</div><div className="font-medium">{fin.status_description}</div></div>
                          <div><div className="text-xs text-muted-foreground">Total</div><div className="font-medium">{fin.total_parcelas} parcelas</div></div>
                          <div><div className="text-xs text-muted-foreground">Pago</div><div className="font-medium">{fin.parcelas_pagas} parcelas</div></div>
                          <div><div className="text-xs text-muted-foreground">Valor</div><div className="font-medium">{new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(parseFloat(fin.valor_parcela_ref))}</div></div>
                          <div className="col-span-2"><div className="text-xs text-muted-foreground">Órgão Pagamento</div><div className="font-medium">{fin.orgao_pagamento_nome || fin.orgao_pagamento} - {fin.entity_name}</div></div>
                          <div><div className="text-xs text-muted-foreground">Referência</div><div className="font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-500" />{referencia || '-'}</div></div>
                          <div><div className="text-xs text-muted-foreground">Importado em</div><div className="font-medium text-xs flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-purple-500" />{fin.created_at ? new Date(fin.created_at).toLocaleDateString('pt-BR') : '-'}</div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Informações adicionais da simulação */}
                {caseDetail.simulation && caseDetail.simulation.totals && (
                  <div className="mt-4 pt-3 border-t">
                    <h3 className="font-medium mb-3 text-sm">Resumo da Simulação</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded border border-success/40 bg-success/5 p-3">
                        <div className="text-xs text-muted-foreground">Valor Liberado Total</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(caseDetail.simulation.totals.liberadoTotal)}
                        </div>
                      </div>
                      {caseDetail.simulation.totals.seguroObrigatorio && (
                        <div className="rounded border border-info/40 bg-info/5 p-3">
                          <div className="text-xs text-muted-foreground">Seguro Obrigatório</div>
                          <div className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(caseDetail.simulation.totals.seguroObrigatorio)}
                          </div>
                        </div>
                      )}
                      <div className="rounded border border-warning/40 bg-warning/5 p-3">
                        <div className="text-xs text-muted-foreground">Custo Consultoria</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(caseDetail.simulation.totals.custoConsultoria)}
                        </div>
                      </div>
                      <div className="rounded border border-accent/40 bg-accent/5 p-3">
                        <div className="text-xs text-muted-foreground">Consultoria Líquida</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(caseDetail.simulation.totals.custoConsultoriaLiquido || (caseDetail.simulation.totals.custoConsultoria * 0.86))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Endereço */}
            {clientAddresses && clientAddresses.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  📍 Endereço
                </h3>
                {clientAddresses.slice(0, 1).map((address: any) => (
                  <div key={address.id} className="space-y-2 text-sm">
                    {address.cidade && address.estado && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">Cidade/Estado:</span>
                        <span className="font-medium">{address.cidade}, {address.estado}</span>
                      </div>
                    )}
                    {address.cep && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">CEP:</span>
                        <span className="font-medium">{address.cep}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </Card>

        {/* Coluna 2: Anexos e Telefones */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Documentos e Contato</h2>

          {/* Telefone */}
          <div className="space-y-3">
            <div>
              <Label>Telefone Preferencial</Label>
              <div className="flex gap-2">
                <Input
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!clientId) {
                      toast.error("Carregando dados do cliente...");
                      return;
                    }
                    const unformatted = unformatPhone(telefone);
                    if (unformatted && unformatted.length >= 10) {
                      addPhone.mutate({
                        clientId: clientId,
                        phone: unformatted,
                        isPrimary: true
                      });
                    } else {
                      toast.error("Digite um telefone válido");
                    }
                  }}
                  disabled={addPhone.isPending || !telefone || !clientId}
                >
                  {addPhone.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload de Contracheque e Anexos */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Upload de Contracheque e Anexos</h3>
            <AttachmentUploader caseId={caseId} />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Anexos Existentes</h3>
            {attachmentsLoading ? (
              <div className="text-sm text-muted-foreground">
                Carregando anexos...
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg bg-card border-border hover:bg-card-hover transition-colors">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium">{attachment.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString() : 'Data não disponível'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-primary/10"
                        onClick={() => {
                          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
                          window.open(`${baseUrl}/cases/${caseId}/attachments/${attachment.id}/download`, '_blank');
                        }}
                        title="Ver/Baixar anexo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => {
                          if (confirm(`Deseja remover o anexo "${attachment.filename}"?`)) {
                            deleteAttachment.mutate({
                              caseId: caseId,
                              attachmentId: attachment.id
                            });
                          }
                        }}
                        disabled={deleteAttachment.isPending}
                        title="Remover anexo"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${caseDetail.status === "em_atendimento" ? "p-3 bg-amber-50 border border-amber-200 rounded-md" : "text-sm text-muted-foreground"}`}>
                {caseDetail.status === "em_atendimento" ? (
                  <>
                    <div className="flex items-center gap-2 text-amber-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                        <path d="M12 9v4"/>
                        <path d="m12 17 .01 0"/>
                      </svg>
                      <span className="text-sm font-medium">Nenhum anexo encontrado</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      É necessário anexar pelo menos um contracheque para enviar o caso para simulação.
                    </p>
                  </>
                ) : (
                  "Nenhum anexo encontrado"
                )}
              </div>
            )}
          </div>

           {/* Histórico de Números */}
           <div className="border-t pt-4">
             <h3 className="font-medium mb-2">Histórico de Números</h3>
             {clientPhones && clientPhones.length > 0 ? (
               <div className={`space-y-2 ${clientPhones.length >= 3 ? 'max-h-48 overflow-y-auto pr-2' : ''}`}>
                  {clientPhones.map((phoneRecord: any) => (
                    <div
                      key={phoneRecord.id}
                      className="flex items-center justify-between rounded border border-border/40 bg-muted/40 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatPhone(phoneRecord.phone)}</span>
                        {phoneRecord.is_primary && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {phoneRecord.created_at ? new Date(phoneRecord.created_at).toLocaleDateString() : ''}
                        </span>
                        {!phoneRecord.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => {
                              if (!clientId) {
                                toast.error("Erro ao carregar dados do cliente");
                                return;
                              }
                              if (confirm("Deseja remover este telefone do histórico?")) {
                                deletePhone.mutate({
                                  clientId: clientId,
                                  phoneId: phoneRecord.id
                                });
                              }
                            }}
                            disabled={deletePhone.isPending || !clientId}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-sm text-muted-foreground">
                 Nenhum número anterior registrado
               </div>
             )}
           </div>
        </Card>

        {/* Coluna 3: Simulação do Atendimento */}
        {caseDetail.simulation ? (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-medium">Simulação do Atendimento</h2>

            {caseDetail.simulation.status === 'pending' && (
              <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3 text-sm text-warning-foreground">
                ⏳ Simulação pendente de análise pelo calculista
              </div>
            )}

            {caseDetail.simulation.status === 'approved' && caseDetail.simulation.totals && (
              <div className="space-y-4">
                <div className="rounded-lg border border-success/40 bg-success-subtle p-3 text-sm text-success-foreground">
                  ✅ Simulação aprovada em {new Date(caseDetail.simulation.created_at).toLocaleDateString()}
                </div>
                <SimulationResultCard
                  totals={{
                    valorParcelaTotal: caseDetail.simulation.totals.valorParcelaTotal,
                    saldoTotal: caseDetail.simulation.totals.saldoTotal,
                    liberadoTotal: caseDetail.simulation.totals.liberadoTotal,
                    totalFinanciado: caseDetail.simulation.totals.totalFinanciado,
                    valorLiquido: caseDetail.simulation.totals.valorLiquido,
                    custoConsultoria: caseDetail.simulation.totals.custoConsultoria,
                    liberadoCliente: caseDetail.simulation.totals.liberadoCliente,
                    seguroObrigatorio: caseDetail.simulation.totals.seguroObrigatorio,
                    custoConsultoriaLiquido: caseDetail.simulation.totals.custoConsultoriaLiquido
                  }}
                  simulation={{
                    banks: caseDetail.simulation.banks || [],
                    prazo: caseDetail.simulation.prazo || 0,
                    coeficiente: "",
                    seguro: caseDetail.simulation.totals.seguroObrigatorio || 0,
                    percentualConsultoria: caseDetail.simulation.percentualConsultoria || 0
                  }}
                  isActive={true}
                />

                {/* Consultoria Líquida - Exibir quando aprovado */}
                {caseDetail.simulation.status === 'approved' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900">Consultoria Líquida (86%)</span>
                      <span className="text-lg font-bold text-green-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(
                          caseDetail.simulation.totals.custoConsultoriaLiquido ??
                          (caseDetail.simulation.totals.custoConsultoria * 0.86)
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Valor líquido da consultoria após descontos
                    </p>
                  </div>
                )}
              </div>
            )}

            {caseDetail.simulation.status === 'rejected' && (
              <div className="rounded-lg border border-danger/40 bg-danger-subtle p-3 text-sm text-danger-foreground">
                ❌ Simulação reprovada em {new Date(caseDetail.simulation.created_at).toLocaleDateString()}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-2">Simulação do Atendimento</h2>
            <div className="text-sm text-muted-foreground">
              Nenhuma simulação cadastrada ainda
            </div>
          </Card>
        )}
      </div>


      {/* Chat do Caso */}
      <CaseChat caseId={caseId} defaultChannel="ATENDIMENTO" />

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
                        {event.type === 'case.sent_to_calculista' && '🧮 Enviado para calculista'}
                        {!['case.created', 'case.assigned', 'case.status_changed', 'case.updated', 'attachment.added', 'attachment.deleted', 'simulation.created', 'simulation.approved', 'simulation.rejected', 'case.sent_to_calculista'].includes(event.type) && `📌 ${event.type}`}
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
    </div>
  );
}
