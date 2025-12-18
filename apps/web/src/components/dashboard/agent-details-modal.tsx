"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from "@lifecalling/ui";
import { X, Filter, CheckCircle, Clock, XCircle, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { formatDateBR, parseApiDate } from "@/lib/timezone";

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: number | null;
  agentName?: string;
  from?: string;
  to?: string;
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  disponivel: "Disponível",
  em_atendimento: "Em Atendimento",
  calculista_pendente: "Calculista Pendente",
  calculo_aprovado: "Cálculo Aprovado",
  fechamento_aprovado: "Fechamento Aprovado",
  financeiro_pendente: "Financeiro Pendente",
  contrato_efetivado: "Contrato Efetivado",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
  rejeitado: "Rejeitado",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  disponivel: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  em_atendimento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  calculista_pendente: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  calculo_aprovado: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  fechamento_aprovado: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  financeiro_pendente: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  contrato_efetivado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  encerrado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  rejeitado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function AgentDetailsModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  from,
  to,
}: AgentDetailsModalProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-cases", agentId, from, to, statusFilter],
    queryFn: async () => {
      if (!agentId) return null;
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (statusFilter) params.append("status", statusFilter);
      const response = await api.get(`/analytics/agent-cases/${agentId}?${params.toString()}`);
      return response.data;
    },
    enabled: isOpen && !!agentId,
  });

  const cases = data?.cases || [];
  const agent = data?.agent;

  // Contar casos por status
  const statusCounts = cases.reduce((acc: Record<string, number>, case_: any) => {
    acc[case_.status] = (acc[case_.status] || 0) + 1;
    return acc;
  }, {});

  const formatDuration = (hours: number | null) => {
    if (!hours) return "-";
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const safeDate = (value: string | null | undefined) => {
    if (!value) return null;
    return parseApiDate(value) ?? null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Casos do Agente: {agentName || agent?.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {agent?.email} • Total: {data?.total_cases || 0} casos
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Filtros por Status */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              Todos ({cases.length})
            </Button>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="gap-2"
              >
                {STATUS_LABELS[status] || status} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Casos */}
        <div className="flex-1 overflow-y-auto border-t mt-4">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum caso encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter
                  ? `Não há casos com status "${STATUS_LABELS[statusFilter]}"`
                  : "Este agente não possui casos no período selecionado"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {cases.map((case_: any) => (
                <div
                  key={case_.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">
                          Caso #{case_.id} - {case_.client_name}
                        </h4>
                        <Badge className={STATUS_COLORS[case_.status] || ""}>
                          {STATUS_LABELS[case_.status] || case_.status}
                        </Badge>
                        <Link
                          href={`/casos/${case_.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver Caso
                          </Button>
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CPF: {case_.client_cpf}
                      </p>
                    </div>
                    {case_.consultoria_liquida > 0 && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        R${" "}
                        {case_.consultoria_liquida.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Criado em</p>
	                        <p className="font-medium">
	                          {case_.created_at ? formatDateBR(case_.created_at) : "-"}
	                        </p>
	                      </div>
	                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duração</p>
                        <p className="font-medium">
                          {formatDuration(case_.duration_hours)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Última atualização</p>
	                        <p className="font-medium">
	                          {case_.last_update_at && safeDate(case_.last_update_at)
	                            ? formatDistanceToNow(safeDate(case_.last_update_at)!, {
	                                addSuffix: true,
	                                locale: ptBR,
	                              })
	                            : "-"}
	                        </p>
	                      </div>
	                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com Resumo */}
        {!isLoading && cases.length > 0 && (
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {cases.length} {cases.length === 1 ? "caso" : "casos"}
              {statusFilter && ` com status "${STATUS_LABELS[statusFilter]}"`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Total de Consultoria:
              </span>
              <span className="text-lg font-bold text-green-600">
                R${" "}
                {cases
                  .reduce((sum: number, c: any) => sum + c.consultoria_liquida, 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
