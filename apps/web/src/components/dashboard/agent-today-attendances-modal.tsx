"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from "@lifecalling/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Calendar, Clock, ExternalLink, TrendingUp, UserRound, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRASILIA_TIMEZONE, formatDateBR, parseApiDate } from "@/lib/timezone";

interface AgentTodayAttendancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: number | null;
  agentName?: string;
}

interface TodayAttendanceCase {
  id: number;
  status: string;
  client_name: string;
  client_cpf: string;
  created_at: string | null;
  last_update_at: string | null;
  picked_at: string | null;
  advanced_at: string | null;
  advanced_types: string[];
}

interface AgentTodayAttendancesResponse {
  agent: { id: number; name: string; email: string };
  day: string; // YYYY-MM-DD
  picked_cases: number;
  advanced_cases: number;
  total_cases: number;
  cases: TodayAttendanceCase[];
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  disponivel: "Disponível",
  em_atendimento: "Em Atendimento",
  sem_contato: "Sem Contato",
  calculista_pendente: "Calculista Pendente",
  calculo_aprovado: "Cálculo Aprovado",
  fechamento_pendente: "Fechamento Pendente",
  fechamento_aprovado: "Fechamento Aprovado",
  financeiro_pendente: "Financeiro Pendente",
  contrato_efetivado: "Contrato Efetivado",
  caso_cancelado: "Caso Cancelado",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
  rejeitado: "Rejeitado",
  devolvido_financeiro: "Devolvido Financeiro",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  disponivel: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  em_atendimento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  sem_contato: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  calculista_pendente: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  calculo_aprovado: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  fechamento_pendente: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  fechamento_aprovado: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  financeiro_pendente: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  contrato_efetivado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  caso_cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  encerrado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  rejeitado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  devolvido_financeiro: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function AgentTodayAttendancesModal({
  isOpen,
  onClose,
  agentId,
  agentName,
}: AgentTodayAttendancesModalProps) {
  const { data, isLoading } = useQuery<AgentTodayAttendancesResponse | null>({
    queryKey: ["analytics", "agent-today-attendances", agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const response = await api.get(`/analytics/agent-today-attendances/${agentId}`);
      return response.data;
    },
    enabled: isOpen && !!agentId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const cases = data?.cases || [];

  const formatTime = (iso: string | null) => {
    if (!iso) return null;
    const d = parseApiDate(iso);
    if (!d) return null;
    return d.toLocaleTimeString("pt-BR", {
      timeZone: BRASILIA_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <UserRound className="h-6 w-6" />
                Atendimentos de Hoje — {agentName || data?.agent?.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.agent?.email} • {data?.day || ""} • Pegos: {data?.picked_cases || 0} • Avanços:{" "}
                {data?.advanced_cases || 0} • Total: {data?.total_cases || 0}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border-t mt-4">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum atendimento encontrado hoje
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Este agente não pegou casos ou não registrou avanços hoje.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {cases.map((case_) => (
                <div
                  key={case_.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">
                          Caso #{case_.id} - {case_.client_name}
                        </h4>
                        <Badge className={STATUS_COLORS[case_.status] || ""}>
                          {STATUS_LABELS[case_.status] || case_.status}
                        </Badge>
                        {case_.picked_at && (
                          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                            Pegou {formatTime(case_.picked_at) ? `às ${formatTime(case_.picked_at)}` : ""}
                          </Badge>
                        )}
                        {case_.advanced_at && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            Avançou {formatTime(case_.advanced_at) ? `às ${formatTime(case_.advanced_at)}` : ""}
                          </Badge>
                        )}
                        <Link href={`/casos/${case_.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Ver Caso
                          </Button>
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CPF: {case_.client_cpf}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                        <p className="text-xs text-muted-foreground">Última atualização</p>
                        <p className="font-medium">
                          {case_.last_update_at && parseApiDate(case_.last_update_at)
                            ? formatDistanceToNow(parseApiDate(case_.last_update_at)!, {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ações</p>
                        <p className="font-medium">
                          {case_.picked_at ? "Pegou" : ""}{case_.picked_at && case_.advanced_at ? " • " : ""}
                          {case_.advanced_at ? "Avançou" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
