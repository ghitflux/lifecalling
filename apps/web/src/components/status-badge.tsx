import { cn } from "@/lib/utils";

type Status =
  | "novo" | "em_atendimento" | "aguardando_aprovacao"
  | "aprovado" | "reprovado"
  | "calculista_pendente" | "fechamento_pendente" | "financeiro_pendente"
  | "contrato_efetivado" | "encerrado";

const MAP: Record<Status, string> = {
  novo: "bg-muted text-foreground",
  em_atendimento: "bg-info/20 text-info",
  aguardando_aprovacao: "bg-warning/20 text-warning",
  aprovado: "bg-success/20 text-success",
  reprovado: "bg-danger/20 text-danger",
  calculista_pendente: "bg-info/20 text-info",
  fechamento_pendente: "bg-warning/20 text-warning",
  financeiro_pendente: "bg-info/20 text-info",
  contrato_efetivado: "bg-primary/20 text-primary",
  encerrado: "bg-muted text-foreground/70",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MAP[status])}>
      {status.replaceAll("_"," ")}
    </span>
  );
}