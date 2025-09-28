"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, type Status } from "@lifecalling/ui";
import { SimulationCard, DetailsSkeleton } from "@lifecalling/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSendToCalculista } from "@/lib/hooks";
import AttachmentUploader from "@/components/cases/AttachmentUploader";

interface CaseDetail {
  id: number;
  status: string;
  client: {
    id: number;
    name: string;
    cpf: string;
    matricula: string;
    orgao: string;
    telefone_preferencial?: string;
    numero_cliente?: string;
    observacoes?: string;
  };
  simulation?: {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    results?: {
      valorLiberado: number;
      valorParcela: number;
      taxaJuros: number;
      prazo: number;
    };
    created_at: string;
  };
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  
  const [telefone, setTelefone] = useState("");
  const [numeroCliente, setNumeroCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Hook para enviar para calculista
  const sendCalc = useSendToCalculista();

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

  // Atualiza os campos quando os dados chegam
  useEffect(() => {
    if (caseDetail) {
      setTelefone(caseDetail.client.telefone_preferencial || "");
      setNumeroCliente(caseDetail.client.numero_cliente || "");
      setObservacoes(caseDetail.client.observacoes || "");
    }
  }, [caseDetail]);

  // Mutation para atualizar caso
  const updateCaseMutation = useMutation({
    mutationFn: async (data: { telefone_preferencial?: string; numero_cliente?: string; observacoes?: string }) => {
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


  const handleSave = () => {
    const updates: { telefone_preferencial?: string; numero_cliente?: string; observacoes?: string } = {};
    if (telefone !== (caseDetail?.client.telefone_preferencial || "")) {
      updates.telefone_preferencial = telefone;
    }
    if (numeroCliente !== (caseDetail?.client.numero_cliente || "")) {
      updates.numero_cliente = numeroCliente;
    }
    if (observacoes !== (caseDetail?.client.observacoes || "")) {
      updates.observacoes = observacoes;
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
          <div className="text-red-500 mb-4">Erro ao carregar detalhes do caso</div>
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
        <div className="text-center py-8 text-red-500">Caso não encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Caso #{caseDetail.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={caseDetail.status as Status} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Sem Contato</Button>
          <Button onClick={handleSendToCalculista} disabled={sendCalc.isPending}>
            {sendCalc.isPending ? "Enviando..." : "Enviar para Calculista"}
          </Button>
        </div>
      </div>

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
              <Input value={caseDetail.client.orgao} disabled />
            </div>
            
            <div>
              <Label>Telefone Preferencial</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Número do Cliente</Label>
              <Input
                value={numeroCliente}
                onChange={(e) => setNumeroCliente(e.target.value)}
                placeholder="(11) 99999-9999"
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
            <div className="text-sm text-muted-foreground">
              Nenhum anexo encontrado
            </div>
            {/* Lista anexos exist. se sua API devolve */}
            {/* attachments?.map(a => <a key={a.id} href={a.url} target="_blank">{a.name}</a>) */}
          </div>
        </Card>
      </div>

      {/* Informações da Simulação */}
      {caseDetail.simulation && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Simulação do Caso</h2>

          {caseDetail.simulation.status === 'pending' && (
            <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              ⏳ Simulação pendente de análise pelo calculista
            </div>
          )}

          {caseDetail.simulation.status === 'approved' && caseDetail.simulation.results && (
            <div className="space-y-4">
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                ✅ Simulação aprovada em {new Date(caseDetail.simulation.created_at).toLocaleDateString()}
              </div>
              <SimulationCard
                result={{
                  banco: "N/A",
                  valorLiberado: caseDetail.simulation.results.valorLiberado,
                  valorParcela: caseDetail.simulation.results.valorParcela,
                  coeficiente: 0,
                  saldoDevedor: 0,
                  valorTotalFinanciado: 0,
                  seguroObrigatorio: 0,
                  valorLiquido: 0,
                  custoConsultoria: 0,
                  liberadoCliente: caseDetail.simulation.results.valorLiberado,
                  percentualConsultoria: 0,
                  taxaJuros: caseDetail.simulation.results.taxaJuros,
                  prazo: caseDetail.simulation.results.prazo
                }}
                isActive={true}
              />
            </div>
          )}

          {caseDetail.simulation.status === 'rejected' && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              ❌ Simulação reprovada em {new Date(caseDetail.simulation.created_at).toLocaleDateString()}
            </div>
          )}
        </Card>
      )}

      {/* Histórico do Caso */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Histórico do Caso</h2>
        <div className="text-sm text-muted-foreground">
          Histórico de eventos será implementado em breve...
        </div>
      </Card>
    </div>
  );
}