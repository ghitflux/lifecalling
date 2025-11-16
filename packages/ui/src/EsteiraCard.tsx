/* packages/ui/src/EsteiraCard.tsx */
import React from "react";
import { StatusBadge, type Status } from "./StatusBadge";
import { Button } from "./Button";
import { AdvancedCard } from "./AdvancedCard";
import { User, Calendar, Hash, Building2, MessageSquare, Phone } from "lucide-react";

interface EsteiraCardProps {
  caso: {
    id: number;
    status: Status | string;
    client: {
      name: string;
      cpf: string;
      matricula: string;
    };
    assigned_to?: string;
    created_at: string;
    banco?: string;
    telefone_preferencial?: string;
    observacoes?: string;
  };
  onAssign?: (id: number) => void;
  onView: (id: number) => void;
}

export function EsteiraCard({ caso, onAssign, onView }: EsteiraCardProps) {
  return (
    <AdvancedCard
      title={caso.client.name}
      subtitle={`CPF: ${caso.client.cpf}`}
      badge={<StatusBadge status={caso.status} size="sm" />}
      footer={
        <div className="flex gap-1">
          {onAssign && !caso.assigned_to && (
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onAssign(caso.id)}
            >
              Pegar Caso
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onView(caso.id)}
          >
            Ver Detalhes
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {/* Linha 1 - Coluna 1: Matrícula */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Hash className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">Mat: {caso.client.matricula}</span>
        </div>

        {/* Linha 1 - Coluna 2: Banco */}
        {caso.banco && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{caso.banco}</span>
          </div>
        )}

        {/* Linha 2 - Coluna 1: Atendente */}
        {caso.assigned_to && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{caso.assigned_to}</span>
          </div>
        )}

        {/* Linha 2 - Coluna 2: Data */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>{new Date(caso.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </AdvancedCard>
  );
}
