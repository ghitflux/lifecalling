/* packages/ui/src/EsteiraCard.tsx */
import React from "react";
import { StatusBadge, type Status } from "./StatusBadge";
import { Button } from "./Button";
import { AdvancedCard } from "./AdvancedCard";
import { User, Calendar, Hash, Building2, MessageSquare, Phone, Edit } from "lucide-react";

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
  onEdit?: (id: number) => void;
}

export function EsteiraCard({ caso, onAssign, onView, onEdit }: EsteiraCardProps) {
  return (
    <AdvancedCard
      title={caso.client.name}
      subtitle={`CPF: ${caso.client.cpf}`}
      badge={<StatusBadge status={caso.status} size="sm" />}
      footer={
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onView(caso.id)}
          >
            Ver Detalhes
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(caso.id)}
              className="px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onAssign && !caso.assigned_to && (
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onAssign(caso.id)}
            >
              Pegar Caso
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Hash className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">Mat: {caso.client.matricula}</span>
        </div>
        {caso.banco && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{caso.banco}</span>
          </div>
        )}
        {caso.assigned_to && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{caso.assigned_to}</span>
          </div>
        )}
        {caso.telefone_preferencial && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{caso.telefone_preferencial}</span>
          </div>
        )}
        {caso.observacoes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{caso.observacoes}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>{new Date(caso.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </AdvancedCard>
  );
}
