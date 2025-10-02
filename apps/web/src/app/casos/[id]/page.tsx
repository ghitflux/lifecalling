"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { useSendToCalculista, useReassignCase, useUsers } from "@/lib/hooks";
import { formatPhone, unformatPhone } from "@/lib/masks";
import AttachmentUploader from "@/components/cases/AttachmentUploader";

interface CaseDetail {
  id: number;
  status: string;
  assigned_to?: string;
  assigned_user_id?: number;
  client: {
    id: number;
    name: string;
    cpf: string;
    matricula: string;
    orgao: string;
    telefone_preferencial?: string;
    numero_cliente?: string;
    observacoes?: string;
    telefone_historico?: string[]; // Histórico de números salvos
    // Dados bancários
    banco?: string;
    agencia?: string;
    conta?: string;
    chave_pix?: string;
    tipo_chave_pix?: string;
    // Dados de financiamento do módulo cliente
    financiamentos?: Array<{
      id: number;
      financiamento_code: string;
      total_parcelas: number;
      parcelas_pagas: number;
      valor_parcela_ref: string;
      orgao_pagamento: string;
      orgao_pagamento_nome?: string;
      entity_name: string;
      status_code: string;
      status_description: string;
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
  const caseId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [telefone, setTelefone] = useState("");
  const [numeroCliente, setNumeroCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [telefoneHistorico, setTelefoneHistorico] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

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

  // Hook para listar usuários ativos
  const { data: users } = useUsers();

  const handleSendToCalculista = async () => {
    try {
      await sendCalc.mutateAsync(caseId);
      toast.success("Caso enviado para calculista com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar para calculista. Tente novamente.");
    }
  };

  // Query para buscar detalhes do caso
  const { data: caseDetail, isLoading, error } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      try {
        const response = await api.get(`/cases/${caseId}`);
        return response.data as CaseDetail;
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error("Você precisa estar logado para ver os detalhes do caso");
          // Redirecionar para login
          window.location.href = '/login';
          throw error;
        }
        toast.error("Erro ao carregar detalhes do caso");
        throw error;
      }
    },
    enabled: !!caseId,
    retry: false, // Não tentar novamente em caso de erro de auth
  });

  // Buscar role do usuário atual
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api.get("/auth/me");
        setUserRole(response.data.role);
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
      setTelefoneHistorico(caseDetail.client.telefone_historico || []);
      setBanco(caseDetail.client.banco || "");
      setAgencia(caseDetail.client.agencia || "");
      setConta(caseDetail.client.conta || "");
      setChavePix(caseDetail.client.chave_pix || "");
      setTipoChavePix(caseDetail.client.tipo_chave_pix || "cpf");
      setSelectedAssignee(caseDetail.assigned_user_id?.toString() || "");
    }
  }, [caseDetail]);

  // Função para adicionar número ao histórico quando salvar
  const adicionarNumeroAoHistorico = (novoTelefone: string) => {
    if (novoTelefone && novoTelefone !== caseDetail?.client.telefone_preferencial) {
      const historicoAtualizado = [...telefoneHistorico];
      if (!historicoAtualizado.includes(novoTelefone)) {
        historicoAtualizado.push(novoTelefone);
        setTelefoneHistorico(historicoAtualizado);
      }
    }
  };

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
      toast.success("Caso atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar caso");
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
      telefone_historico?: string[];
      banco?: string;
      agencia?: string;
      conta?: string;
      chave_pix?: string;
      tipo_chave_pix?: string;
    } = {};

    const unformattedPhone = unformatPhone(telefone);
    if (unformattedPhone !== (caseDetail?.client.telefone_preferencial || "")) {
      updates.telefone_preferencial = unformattedPhone;
      adicionarNumeroAoHistorico(caseDetail?.client.telefone_preferencial || "");
      updates.telefone_historico = telefoneHistorico;
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

  if (!caseDetail) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">Atendimento não encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
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
        <div className="flex gap-3">
          <Button variant="secondary">Sem Contato</Button>
          <Button onClick={handleSendToCalculista} disabled={sendCalc.isPending}>
            {sendCalc.isPending ? "Enviando..." : "Enviar para Calculista"}
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Dados do Cliente</h2>
          
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={caseDetail.client.name} disabled />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CPF</Label>
                <Input value={caseDetail.client.cpf} disabled />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input value={caseDetail.client.matricula} disabled />
              </div>
            </div>
            
            <div>
              <Label>Órgão</Label>
              <Input value={caseDetail.client.orgao || ""} disabled />
            </div>

            {/* Informações Financeiras do Cliente */}
            {caseDetail.client.financiamentos && caseDetail.client.financiamentos.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground">Informações Financeiras</h3>
                {caseDetail.client.financiamentos.map((financiamento, index) => (
                  <div
                    key={financiamento.id}
                    className="rounded-lg border border-border/40 bg-muted/40 p-3 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium">{financiamento.status_description}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-medium">{financiamento.total_parcelas} parcelas</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pago:</span>
                        <div className="font-medium">{financiamento.parcelas_pagas} parcelas</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(parseFloat(financiamento.valor_parcela_ref))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Órgão Pagto:</span>
                        <div className="font-medium">{financiamento.orgao_pagamento_nome || financiamento.orgao_pagamento}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <Label>Telefone Preferencial</Label>
              <Input
                value={telefone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre o caso..."
                rows={4}
              />
            </div>

            {/* Informações Financeiras do Cliente */}
            {caseDetail.client.financiamentos && caseDetail.client.financiamentos.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Informações Financeiras</h3>
                <div className="space-y-3">
                  {caseDetail.client.financiamentos.slice(0, 3).map((fin, index) => (
                    <div
                      key={fin.id}
                      className="grid grid-cols-2 gap-3 rounded-lg border border-border/40 bg-muted/40 p-3 text-sm"
                    >
                      <div>
                        <div className="text-xs text-muted-foreground">Status do Financiamento</div>
                        <div className="font-medium">{fin.status_description}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-medium">{fin.total_parcelas} parcelas</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Pago</div>
                        <div className="font-medium">{fin.parcelas_pagas} parcelas</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Valor</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(parseFloat(fin.valor_parcela_ref))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">Órgão Pagamento</div>
                        <div className="font-medium">
                          {fin.orgao_pagamento_nome || fin.orgao_pagamento} - {fin.entity_name}
                        </div>
                      </div>
                    </div>
                  ))}
                  {caseDetail.client.financiamentos.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      E mais {caseDetail.client.financiamentos.length - 3} financiamentos...
                    </div>
                  )}
                </div>
                
                {/* Informações adicionais da simulação */}
                {caseDetail.simulation && caseDetail.simulation.totals && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded border border-success/40 bg-success-subtle p-2">
                        <div className="text-xs text-muted-foreground">Valor Liberado Total</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(caseDetail.simulation.totals.liberadoTotal)}
                        </div>
                      </div>
                      {caseDetail.simulation.totals.seguroObrigatorio && (
                        <div className="rounded border border-info/40 bg-info-subtle p-2">
                          <div className="text-xs text-muted-foreground">Valor do Seguro Obrigatório</div>
                          <div className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(caseDetail.simulation.totals.seguroObrigatorio)}
                          </div>
                        </div>
                      )}
                      <div className="rounded border border-warning/40 bg-warning-subtle p-2">
                        <div className="text-xs text-muted-foreground">Custo Consultoria</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(caseDetail.simulation.totals.custoConsultoria)}
                        </div>
                      </div>
                      {caseDetail.simulation.totals.custoConsultoriaLiquido && (
                        <div className="rounded border border-accent/40 bg-accent-subtle p-2">
                          <div className="text-xs text-muted-foreground">Custo Líquido da Consultoria (86%)</div>
                          <div className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(caseDetail.simulation.totals.custoConsultoriaLiquido)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateCaseMutation.isPending}
                className="flex-1"
              >
                {updateCaseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Upload de Anexos */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Documentos</h2>
          <AttachmentUploader caseId={caseId} />

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Anexos Existentes</h3>
            {caseDetail.attachments && caseDetail.attachments.length > 0 ? (
              <div className="space-y-2">
                {caseDetail.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{attachment.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum anexo encontrado
              </div>
            )}
          </div>

           {/* Histórico de Números Salvos */}
           <div className="border-t pt-4">
             <h3 className="font-medium mb-2">Histórico de Números</h3>
             {telefoneHistorico && telefoneHistorico.length > 0 ? (
               <div className="space-y-2">
                  {telefoneHistorico.map((numero, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border border-border/40 bg-muted/40 p-2"
                    >
                     <span className="text-sm">{numero}</span>
                     <span className="text-xs text-muted-foreground">
                       Número anterior
                     </span>
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
      </div>

      {/* Informações da Simulação */}
      {caseDetail.simulation && (
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
            </div>
          )}

          {caseDetail.simulation.status === 'rejected' && (
            <div className="rounded-lg border border-danger/40 bg-danger-subtle p-3 text-sm text-danger-foreground">
              ❌ Simulação reprovada em {new Date(caseDetail.simulation.created_at).toLocaleDateString()}
            </div>
          )}
        </Card>
      )}

      {/* Histórico do Caso */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Histórico do Atendimento</h2>
        <div className="text-sm text-muted-foreground">
          Histórico de eventos será implementado em breve...
        </div>
      </Card>
    </div>
  );
}
