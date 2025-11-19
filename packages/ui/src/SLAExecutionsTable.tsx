/* packages/ui/src/SLAExecutionsTable.tsx */
import React, { useState } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardContent } from "./Card";
import { Pagination } from "./Pagination";
import { cn } from "./lib/utils";
import { Clock, Eye, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

export interface SLAExecution {
  id: number;
  executed_at: string;
  execution_type: 'scheduled' | 'manual';
  cases_expired_count: number;
  cases_released_count: number;
  duration_seconds: number | null;
  executed_by: string | null;
  details?: {
    processed?: number;
    errors?: number;
    already_expired?: number;
    total_cases_found?: number;
  };
}

export interface SLAExecutionsTableProps {
  executions: SLAExecution[];
  onViewDetails?: (id: number) => void;
  loading?: boolean;
  className?: string;
}

export function SLAExecutionsTable({
  executions,
  onViewDetails,
  loading,
  className
}: SLAExecutionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getTypeBadge = (type: 'scheduled' | 'manual') => {
    if (type === 'scheduled') {
      return (
        <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Agendado
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Executado
      </Badge>
    );
  };

  // Paginação
  const totalItems = executions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = executions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Nenhuma execução encontrada</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou aguarde a próxima execução às 18h</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-medium text-slate-300">ID</th>
                  <th className="text-left p-4 font-medium text-slate-300">Data/Hora</th>
                  <th className="text-left p-4 font-medium text-slate-300">Tipo</th>
                  <th className="text-center p-4 font-medium text-slate-300">Casos Expirados</th>
                  <th className="text-center p-4 font-medium text-slate-300">Casos Liberados</th>
                  <th className="text-center p-4 font-medium text-slate-300">Duração</th>
                  <th className="text-left p-4 font-medium text-slate-300">Executado Por</th>
                  <th className="text-center p-4 font-medium text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((execution) => (
                  <tr
                    key={execution.id}
                    className="border-b border-white/5 hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono text-slate-400">#{execution.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{formatDateTime(execution.executed_at)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTypeBadge(execution.execution_type)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "font-medium",
                        execution.cases_expired_count > 0 ? "text-orange-400" : "text-slate-500"
                      )}>
                        {execution.cases_expired_count}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-300">{execution.cases_released_count}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-400">{formatDuration(execution.duration_seconds)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">
                        {execution.executed_by || <span className="text-slate-500">Sistema</span>}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(execution.id)}
                          className="hover:bg-slate-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
          itemsPerPageOptions={[20, 50, 100]}
        />
      )}
    </div>
  );
}
