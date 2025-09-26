/* packages/ui/src/StatusBadge.tsx */
import React from "react";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Calculator,
  Banknote,
  FileText,
  Archive
} from "lucide-react";

export type Status =
  | "novo" | "em_atendimento" | "aguardando_aprovacao"
  | "aprovado" | "reprovado"
  | "calculista_pendente" | "fechamento_pendente" | "financeiro_pendente"
  | "contrato_efetivado" | "encerrado"
  | "atribuido" | "pendente" | "ativo";

const statusConfig: Record<Status, {
  color: string;
  icon: React.ElementType;
}> = {
  novo: {
    color: "bg-muted/30 text-muted-foreground border-muted/50",
    icon: AlertCircle
  },
  em_atendimento: {
    color: "bg-info-subtle text-info-foreground border-info/30 shadow-[0_0_12px_hsl(var(--info)/0.2)]",
    icon: Clock
  },
  aguardando_aprovacao: {
    color: "bg-warning-subtle text-warning-foreground border-warning/30 shadow-[0_0_12px_hsl(var(--warning)/0.2)]",
    icon: Clock
  },
  aprovado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: CheckCircle2
  },
  reprovado: {
    color: "bg-danger-subtle text-danger-foreground border-danger/30",
    icon: XCircle
  },
  calculista_pendente: {
    color: "bg-primary-subtle text-primary border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]",
    icon: Calculator
  },
  fechamento_pendente: {
    color: "bg-accent-subtle text-accent border-accent/30",
    icon: FileCheck
  },
  financeiro_pendente: {
    color: "bg-info-subtle text-info-foreground border-info/30",
    icon: Banknote
  },
  contrato_efetivado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: FileText
  },
  encerrado: {
    color: "bg-muted/20 text-muted-foreground border-muted/30",
    icon: Archive
  },
  atribuido: {
    color: "bg-blue-100 text-blue-800 border-blue/30",
    icon: AlertCircle
  },
  pendente: {
    color: "bg-yellow-100 text-yellow-800 border-yellow/30",
    icon: Clock
  },
  ativo: {
    color: "bg-green-100 text-green-800 border-green/30",
    icon: CheckCircle2
  },
};

export function StatusBadge({
  status,
  showIcon = true,
  size = "default"
}: {
  status: Status | string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const config = statusConfig[status as Status];

  // Debug para identificar status não mapeados
  if (!config) {
    console.warn(`Status não encontrado: "${status}". Usando fallback "novo".`);
  }

  const finalConfig = config || statusConfig.novo;
  const Icon = finalConfig.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    default: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium rounded-full border backdrop-blur-sm transition-all duration-200",
        finalConfig.color,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{String(status).replace(/_/g, " ")}</span>
    </div>
  );
}
