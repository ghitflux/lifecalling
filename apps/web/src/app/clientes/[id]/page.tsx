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
  const { data: clientCases } = useQuery({
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
            <label className="text-sm font-medium text-muted-foreground">CPF</label>
            <p className="text-lg font-mono">{formatCPF(client.cpf)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
            <p className="text-lg font-mono">{client.matricula}</p>
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
      {clientCases && clientCases.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Casos e Atendimentos ({clientCases.length})
          </h2>

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