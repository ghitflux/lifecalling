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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
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
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onAssign && !caso.assigned_to && (
            <Button
              className="flex-1"
              onClick={() => onAssign(caso.id)}
            >
              Pegar Caso
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>Matrícula: {caso.client.matricula}</span>
        </div>
        {caso.banco && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{caso.banco}</span>
          </div>
        )}
        {caso.assigned_to && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{caso.assigned_to}</span>
          </div>
        )}
        {caso.telefone_preferencial && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{caso.telefone_preferencial}</span>
          </div>
        )}
        {caso.observacoes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4 mt-0.5" />
            <span className="line-clamp-2">{caso.observacoes}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(caso.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </AdvancedCard>
  );
}
