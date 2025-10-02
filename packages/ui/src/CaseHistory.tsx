/* packages/ui/src/CaseHistory.tsx */
import React, { useState } from "react";
import { Badge } from "./Badge";
import { Input } from "./Input";
import { cn } from "./lib/utils";
import { Search, Clock, User, FileText, CheckCircle, XCircle, DollarSign, Calculator, Archive } from "lucide-react";

export interface CaseEvent {
  id: number;
  type: string;
  created_at: string;
  payload?: any;
  created_by?: number;
  user_name?: string;
}

export interface CaseHistoryProps {
  events: CaseEvent[];
  className?: string;
  showSearch?: boolean;
}

// Mapeamento de tipos de eventos para português e ícones
const eventTypeMap: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "case.created": { label: "Caso Criado", icon: FileText, color: "text-info" },
  "case.assigned": { label: "Caso Atribuído", icon: User, color: "text-primary" },
  "case.to_calculista": { label: "Enviado ao Calculista", icon: Calculator, color: "text-warning" },
  "simulation.approved": { label: "Simulação Aprovada", icon: CheckCircle, color: "text-success" },
  "simulation.rejected": { label: "Simulação Rejeitada", icon: XCircle, color: "text-danger" },
  "closing.approved": { label: "Fechamento Aprovado", icon: CheckCircle, color: "text-success" },
  "closing.rejected": { label: "Fechamento Rejeitado", icon: XCircle, color: "text-danger" },
  "case.sent_to_finance": { label: "Enviado ao Financeiro", icon: DollarSign, color: "text-success" },
  "contract.disbursed": { label: "Contrato Efetivado", icon: DollarSign, color: "text-success" },
  "case.updated": { label: "Caso Atualizado", icon: FileText, color: "text-info" },
  "case.return_to_calculista": { label: "Devolvido ao Calculista", icon: Calculator, color: "text-warning" },
  "finance.returned_to_calculista": { label: "Devolvido ao Calculista", icon: Calculator, color: "text-warning" },
  "case.archived": { label: "Caso Arquivado", icon: Archive, color: "text-muted-foreground" },
};

// Função para formatar o payload de forma legível
const formatPayload = (type: string, payload: any): React.ReactNode => {
  if (!payload || Object.keys(payload).length === 0) return null;

  switch (type) {
    case "case.assigned":
      if (payload.to) {
        return (
          <div className="text-xs text-muted-foreground mt-1">
            Atribuído para: <span className="font-medium">{payload.to}</span>
          </div>
        );
      }
      break;
    case "simulation.approved":
    case "simulation.rejected":
      if (payload.simulation_id) {
        return (
          <div className="text-xs text-muted-foreground mt-1">
            ID da Simulação: <span className="font-medium">{payload.simulation_id}</span>
            {payload.liberado_cliente && (
              <> • Liberado: <span className="font-medium">R$ {Number(payload.liberado_cliente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>
            )}
            {payload.total_financiado && (
              <> • Total: <span className="font-medium">R$ {Number(payload.total_financiado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>
            )}
          </div>
        );
      }
      break;
    case "case.return_to_calculista":
    case "finance.returned_to_calculista":
      return (
        <div className="text-xs text-muted-foreground mt-1">
          {payload.returned_by_name && (
            <div>Devolvido por: <span className="font-medium">{payload.returned_by_name}</span></div>
          )}
          {payload.previous_status && (
            <div>Status anterior: <span className="font-medium">{payload.previous_status}</span></div>
          )}
          {payload.reason && (
            <div className="italic">{payload.reason}</div>
          )}
        </div>
      );
    case "case.updated":
      const updates = Object.entries(payload)
        .filter(([key]) => !key.includes("_at"))
        .map(([key, value]) => {
          if (value === null) return null;
          return `${key}: ${value}`;
        })
        .filter(Boolean);

      if (updates.length > 0) {
        return (
          <div className="text-xs text-muted-foreground mt-1">
            {updates.join(" • ")}
          </div>
        );
      }
      break;
    default:
      // Para outros tipos, mostrar payload de forma compacta
      const entries = Object.entries(payload).filter(([key, val]) => val !== null && val !== undefined);
      if (entries.length > 0) {
        return (
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {entries.map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            ))}
          </div>
        );
      }
  }

  return null;
};

export function CaseHistory({ events, className, showSearch = true }: CaseHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar eventos por termo de busca
  const filteredEvents = searchTerm
    ? events.filter((event) => {
        const eventInfo = eventTypeMap[event.type];
        const label = eventInfo?.label || event.type;
        return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
               event.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : events;

  // Ordenar por data decrescente (mais recente primeiro)
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Campo de busca */}
      {showSearch && events.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Lista de eventos */}
      {sortedEvents.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedEvents.map((event) => {
            const eventInfo = eventTypeMap[event.type] || {
              label: event.type,
              icon: FileText,
              color: "text-muted-foreground"
            };
            const IconComponent = eventInfo.icon;

            return (
              <div
                key={event.id}
                className="p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Ícone */}
                  <div className={cn("mt-0.5", eventInfo.color)}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{eventInfo.label}</span>
                        {event.user_name && (
                          <span className="text-xs text-muted-foreground ml-2">
                            por {event.user_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {new Date(event.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Payload formatado */}
                    {formatPayload(event.type, event.payload)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento registrado"}
        </div>
      )}
    </div>
  );
}
