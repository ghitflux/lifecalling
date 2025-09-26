import React from "react";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";

export type Status =
  | "novo" | "em_atendimento" | "aguardando_aprovacao"
  | "aprovado" | "reprovado"
  | "calculista_pendente" | "fechamento_pendente" | "financeiro_pendente"
  | "contrato_efetivado" | "encerrado";

const statusColors: Record<Status, string> = {
  novo: "bg-muted text-muted-foreground",
  em_atendimento: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aguardando_aprovacao: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  aprovado: "bg-green-500/10 text-green-400 border-green-500/20",
  reprovado: "bg-red-500/10 text-red-400 border-red-500/20",
  calculista_pendente: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fechamento_pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  financeiro_pendente: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contrato_efetivado: "bg-primary/10 text-primary border-primary/20",
  encerrado: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        statusColors[status],
        "border"
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}