import { cn } from "@/lib/utils";

type Status =
  | "novo" | "em_atendimento" | "aguardando_aprovacao"
  | "aprovado" | "reprovado"
  | "calculista_pendente" | "fechamento_pendente" | "fechamento_aprovado" | "financeiro_pendente"
  | "contrato_efetivado" | "encerrado";

const MAP: Record<Status, string> = {
  novo: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  em_atendimento: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  aguardando_aprovacao: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  aprovado: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  reprovado: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  calculista_pendente: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  fechamento_pendente: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  fechamento_aprovado: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  financeiro_pendente: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  contrato_efetivado: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  encerrado: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MAP[status])}>
      {status.replaceAll("_"," ")}
    </span>
  );
}