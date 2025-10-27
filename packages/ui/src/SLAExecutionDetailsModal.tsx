/* packages/ui/src/SLAExecutionDetailsModal.tsx */
import React from "react";
import { Dialog } from "./Dialog";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { cn } from "./lib/utils";
import { Clock, Users, AlertTriangle, CheckCircle2, XCircle, FileText, User, ExternalLink } from "lucide-react";

export interface CaseReleased {
  case_id: number;
  client_id: number;
  client_name: string;
  client_cpf: string;
  assigned_user: string;
  assigned_user_id: number;
  reason: 'expired_with_interaction' | 'expired_no_interaction';
}

export interface SLAExecutionDetails {
  id: number;
  executed_at: string;
  execution_type: 'scheduled' | 'manual';
  cases_expired_count: number;
  cases_released: CaseReleased[];
  duration_seconds: number | null;
  executed_by: string | null;
  executed_by_user_id: number | null;
  details: {
    processed?: number;
    errors?: number;
    already_expired?: number;
    total_cases_found?: number;
  };
}

export interface SLAExecutionDetailsModalProps {
  execution: SLAExecutionDetails | null;
  open: boolean;
  onClose: () => void;
}

export function SLAExecutionDetailsModal({
  execution,
  open,
  onClose
}: SLAExecutionDetailsModalProps) {
  if (!execution) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${minutes}min ${secs}s`;
  };

  const getReasonBadge = (reason: string) => {
    if (reason === 'expired_with_interaction') {
      return (
        <Badge variant="default" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado (com interação)
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-red-500/20 text-red-300 border-red-500/30">
        <XCircle className="w-3 h-3 mr-1" />
        Expirado (sem interação)
      </Badge>
    );
  };

  const casesWithInteraction = execution.cases_released.filter(c => c.reason === 'expired_with_interaction').length;
  const casesWithoutInteraction = execution.cases_released.filter(c => c.reason === 'expired_no_interaction').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80" onClick={onClose} />

        <div className="relative z-50 w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-lg border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Execução #{execution.id}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {formatDateTime(execution.executed_at)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Tipo</p>
                  <div className="mt-1">
                    {execution.execution_type === 'scheduled' ? (
                      <Badge variant="default" className="bg-blue-500/20 text-blue-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Agendado
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500/20 text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Manual
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Duração</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {formatDuration(execution.duration_seconds)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Executado Por</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-white">
                      {execution.executed_by || 'Sistema'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Casos Processados</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {execution.details.processed || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Casos Expirados</p>
                  <p className="text-lg font-semibold text-orange-400 mt-1">
                    {execution.cases_expired_count}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Erros</p>
                  <p className={cn(
                    "text-lg font-semibold mt-1",
                    execution.details.errors && execution.details.errors > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {execution.details.errors || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Interação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Interação</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-yellow-300">Com Interação</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{casesWithInteraction}</p>
                  <p className="text-xs text-yellow-300/70 mt-1">
                    Casos que tiveram comentários, anexos ou telefones registrados
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-300">Sem Interação</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{casesWithoutInteraction}</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    Casos sem nenhuma interação desde a atribuição
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Casos Liberados */}
            {execution.cases_released.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Casos Liberados ({execution.cases_released.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-2 font-medium text-slate-300 w-20">Caso ID</th>
                          <th className="text-left p-2 font-medium text-slate-300 w-48">Cliente</th>
                          <th className="text-left p-2 font-medium text-slate-300 w-32">CPF</th>
                          <th className="text-left p-2 font-medium text-slate-300 w-32">Atendente</th>
                          <th className="text-left p-2 font-medium text-slate-300 w-40">Motivo</th>
                          <th className="text-left p-2 font-medium text-slate-300 w-32">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.cases_released.map((caseItem) => (
                          <tr key={caseItem.case_id} className="border-b border-white/5">
                            <td className="p-2 w-20">
                              <span className="font-mono text-blue-400">#{caseItem.case_id}</span>
                            </td>
                            <td className="p-2 w-48 text-slate-300 truncate" title={caseItem.client_name}>
                              {caseItem.client_name}
                            </td>
                            <td className="p-2 w-32">
                              <span className="font-mono text-slate-400">
                                {caseItem.client_cpf || "—"}
                              </span>
                            </td>
                            <td className="p-2 w-32">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-300 truncate" title={caseItem.assigned_user}>
                                  {caseItem.assigned_user}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 w-40">
                              {getReasonBadge(caseItem.reason)}
                            </td>
                            <td className="p-2 w-32">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => window.open(`/casos/${caseItem.case_id}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Caso
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
