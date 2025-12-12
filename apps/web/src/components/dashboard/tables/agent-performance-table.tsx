"use client";

import React, { useState } from "react";
import { Button } from "@lifecalling/ui";
import { Eye, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";

interface AgentMetrics {
  agent_id: number;
  agent_name: string;
  agent_email: string;
  tma_minutes: number;
  cases_efetivados: number;
  cases_em_atendimento: number;
  cases_cancelados: number;
  consultoria_liquida: number;
  percentual_medio: number;
  total_cases: number;
  sla_within: number;
  sla_outside: number;
  sla_percentage: number;
}

interface AgentPerformanceTableProps {
  agents: AgentMetrics[];
  onViewDetails?: (agentId: number) => void;
  isLoading?: boolean;
}

export function AgentPerformanceTable({
  agents,
  onViewDetails,
  isLoading = false,
}: AgentPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<keyof AgentMetrics | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: keyof AgentMetrics) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedAgents = React.useMemo(() => {
    if (!sortKey) return agents;

    return [...agents].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [agents, sortKey, sortOrder]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum agente encontrado no período selecionado
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("agent_name")}
              >
                <div className="flex items-center gap-2">
                  Agente
                  {sortKey === "agent_name" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("tma_minutes")}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  TMA (min)
                  {sortKey === "tma_minutes" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("cases_efetivados")}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Efetivados
                  {sortKey === "cases_efetivados" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("cases_em_atendimento")}
              >
                <div className="flex items-center gap-2">
                  Em Atendimento
                  {sortKey === "cases_em_atendimento" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("cases_cancelados")}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancelados
                  {sortKey === "cases_cancelados" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("consultoria_liquida")}
              >
                <div className="flex items-center gap-2">
                  Consultoria Líq.
                  {sortKey === "consultoria_liquida" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("percentual_medio")}
              >
                <div className="flex items-center gap-2">
                  % Médio
                  {sortKey === "percentual_medio" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("sla_percentage")}
              >
                <div className="flex items-center gap-2">
                  SLA %
                  {sortKey === "sla_percentage" && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => (
              <tr key={agent.agent_id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div>
                    <div className="font-semibold">{agent.agent_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.agent_email}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.tma_minutes.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600">
                      {agent.cases_efetivados}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-blue-600 font-medium">
                    {agent.cases_em_atendimento}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">
                      {agent.cases_cancelados}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {agent.consultoria_liquida > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold">
                      R${" "}
                      {agent.consultoria_liquida.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-blue-600">
                      {agent.percentual_medio.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`font-semibold ${
                        agent.sla_percentage >= 80
                          ? "text-green-600"
                          : agent.sla_percentage >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {agent.sla_percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({agent.sla_within}/{agent.total_cases})
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Clicou em Ver Detalhes', { agentId: agent.agent_id, onViewDetails });
                      if (onViewDetails) {
                        onViewDetails(agent.agent_id);
                      } else {
                        console.error('onViewDetails não está definido');
                      }
                    }}
                    className="cursor-pointer hover:bg-primary/20 transition-colors relative z-10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
