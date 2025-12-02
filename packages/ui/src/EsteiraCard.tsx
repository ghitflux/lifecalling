/* packages/ui/src/EsteiraCard.tsx */
import React from "react";
import { StatusBadge, type Status } from "./StatusBadge";
import { Button } from "./Button";
import { AdvancedCard } from "./AdvancedCard";
import { User, Calendar, Hash, Building2, MessageSquare, Phone, Briefcase, DollarSign } from "lucide-react";

interface EsteiraCardProps {
  caso: {
    id: number;
    status: Status | string;
    client: {
      name: string;
      cpf: string;
      matricula: string;
      cargo?: string;
    };
    assigned_to?: string;
    created_at: string;
    banco?: string;
    telefone_preferencial?: string;
    observacoes?: string;
    valor_mensalidade?: number;
  };
  onAssign?: (id: number) => void;
  onView: (id: number) => void;
}

export function EsteiraCard({ caso, onAssign, onView }: EsteiraCardProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AdvancedCard
      title={caso.client.name}
      subtitle={`CPF: ${caso.client.cpf}`}
      badge={<StatusBadge status={caso.status} size="sm" />}
      footer={
        <div className="flex gap-2 justify-end">
          {onAssign && !caso.assigned_to && (
            <Button
              size="sm"
              className="text-xs px-4"
              onClick={() => onAssign(caso.id)}
            >
              Pegar Caso
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-4"
            onClick={() => onView(caso.id)}
          >
            Ver Detalhes
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Matrícula */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Hash className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">Mat: {caso.client.matricula}</span>
        </div>

        {/* Cargo */}
        {caso.client.cargo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caso.client.cargo}</span>
          </div>
        )}

        {/* Banco */}
        {caso.banco && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caso.banco}</span>
          </div>
        )}

        {/* Valor da Mensalidade */}
        {caso.valor_mensalidade && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{formatCurrency(caso.valor_mensalidade)}</span>
          </div>
        )}

        {/* Data */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{new Date(caso.created_at).toLocaleDateString('pt-BR')}</span>
        </div>

        {/* Atendente */}
        {caso.assigned_to && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caso.assigned_to}</span>
          </div>
        )}
      </div>
    </AdvancedCard>
  );
}
