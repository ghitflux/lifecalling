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
  | "novo" | "em_atendimento" | "disponivel"
  | "calculista_pendente" | "calculo_aprovado"
  | "fechamento_aprovado" | "fechamento_reprovado"
  | "financeiro_pendente" | "contrato_efetivado" | "encerrado"
  | "sem_contato" | "devolvido_financeiro"
  | "draft" | "approved" | "rejected"  // Status de simulações
  // Status legados (manter para compatibilidade)
  | "aprovado" | "calculo_rejeitado"
  | "aguardando_aprovacao" | "reprovado"
  | "fechamento_pendente" | "atribuido" | "pendente" | "ativo";

const statusConfig: Record<Status, {
  color: string;
  icon: React.ElementType;
  label: string;
}> = {
  // Status principais do fluxo
  novo: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
    label: "Novo"
  },
  em_atendimento: {
    color: "bg-info-subtle text-info-foreground border-info/30 shadow-[0_0_12px_hsl(var(--info)/0.2)]",
    icon: Clock,
    label: "Em Atendimento"
  },
  disponivel: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    icon: CheckCircle2,
    label: "Disponível"
  },
  calculista_pendente: {
    color: "bg-primary-subtle text-primary border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]",
    icon: Calculator,
    label: "Aguardando Calculista"
  },
  calculo_aprovado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: CheckCircle2,
    label: "Cálculo Aprovado"
  },
  fechamento_aprovado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: FileCheck,
    label: "Fechamento Aprovado"
  },
  fechamento_reprovado: {
    color: "bg-danger-subtle text-danger-foreground border-danger/30",
    icon: XCircle,
    label: "Fechamento Reprovado"
  },
  financeiro_pendente: {
    color: "bg-info-subtle text-info-foreground border-info/30",
    icon: Banknote,
    label: "Aguardando Financeiro"
  },
  contrato_efetivado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: FileText,
    label: "Contrato Efetivado"
  },
  encerrado: {
    color: "bg-muted/20 text-muted-foreground border-muted/30",
    icon: Archive,
    label: "Encerrado"
  },

  // Status de simulações
  draft: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Rascunho"
  },
  approved: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    label: "Aprovado"
  },
  rejected: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Rejeitado"
  },

  // Status legados (compatibilidade)
  aprovado: {
    color: "bg-success-subtle text-success-foreground border-success/30",
    icon: CheckCircle2,
    label: "Aprovado (Legado)"
  },
  calculo_rejeitado: {
    color: "bg-danger-subtle text-danger-foreground border-danger/30",
    icon: XCircle,
    label: "Cálculo Rejeitado"
  },
  aguardando_aprovacao: {
    color: "bg-warning-subtle text-warning-foreground border-warning/30 shadow-[0_0_12px_hsl(var(--warning)/0.2)]",
    icon: Clock,
    label: "Aguardando Aprovação"
  },
  reprovado: {
    color: "bg-danger-subtle text-danger-foreground border-danger/30",
    icon: XCircle,
    label: "Reprovado"
  },
  fechamento_pendente: {
    color: "bg-accent-subtle text-accent border-accent/30",
    icon: FileCheck,
    label: "Aguardando Fechamento"
  },
  atribuido: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
    label: "Atribuído"
  },
  pendente: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Pendente"
  },
  ativo: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    label: "Ativo"
  },

  // Status adicionais
  sem_contato: {
    color: "bg-muted/30 text-muted-foreground border-muted/40",
    icon: XCircle,
    label: "Sem Contato"
  },
  devolvido_financeiro: {
    color: "bg-warning-subtle text-warning-foreground border-warning/30",
    icon: AlertCircle,
    label: "Devolvido Financeiro"
  },
};

export function StatusBadge({
  status,
  showIcon = true,
  size = "default",
  description,
  className
}: {
  status: Status | string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
  description?: string;  // Tooltip description
  className?: string;
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
        "inline-flex items-center font-medium rounded-full border backdrop-blur-sm transition-all duration-200 cursor-default",
        finalConfig.color,
        sizeClasses[size],
        className
      )}
      title={description || finalConfig.label}  // HTML tooltip nativo
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{finalConfig.label}</span>
    </div>
  );
}
