/* packages/ui/src/EsteiraCard.tsx */
import React from "react";
import { StatusBadge, type Status } from "./StatusBadge";
import { Button } from "./Button";
import { AdvancedCard } from "./AdvancedCard";
import { User, Calendar, Hash, Building2 } from "lucide-react";

interface EsteiraCardProps {
  caso: {
    id: number;
    status: Status;
    client: {
      name: string;
      cpf: string;
      matricula: string;
    };
    assigned_to?: string;
    created_at: string;
    banco?: string;
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onView(caso.id)}
          >
            Ver Detalhes
          </Button>
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(caso.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </AdvancedCard>
  );
}
