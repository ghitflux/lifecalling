"use client";

/* apps/web/src/app/admin/auditoria/sla/page.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { SLAExecutionsTable, SLAExecutionDetailsModal } from '@lifecalling/ui';
import type { SLAExecution, SLAExecutionDetails } from '@lifecalling/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@lifecalling/ui';
import { Button } from '@lifecalling/ui';
import { Download, RefreshCw, Calendar, TrendingUp, Clock, AlertTriangle, Play } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function SLAAuditPage() {
  const [executions, setExecutions] = useState<SLAExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<SLAExecutionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const router = useRouter();

  // Modal de erro seguindo DS
  const [errorModal, setErrorModal] = useState<{open:boolean; title:string; desc:string; toLogin?:boolean}>({ open:false, title:"", desc:"" });
  const errorShownRef = useRef(false);

  // Filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [executionType, setExecutionType] = useState<string>('');

  // Paginação (gerenciada pelo componente de tabela)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (executionType) params.execution_type = executionType;

      const { data } = await api.get('/sla-audit/executions', { params });
      setExecutions(data.data);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Erro ao buscar execuções:', err);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        const status = err?.response?.status;
        setErrorModal({
          open: true,
          title: status === 401 ? 'Sessão expirada' : 'Erro ao carregar auditoria',
          desc: status === 401 ? 'Faça login novamente para continuar.' : (err?.message || 'Tente novamente mais tarde.'),
          toLogin: status === 401,
        });
      }
    } finally {
      setLoading(false);
      errorShownRef.current = false;
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data } = await api.get('/sla-audit/statistics', { params: { days: '30' } });
      setStatistics(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const { data } = await api.get(`/sla-audit/executions/${id}`);
      setSelectedExecution(data);
    } catch (err: any) {
      console.error('Erro ao buscar detalhes:', err);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        const status = err?.response?.status;
        setErrorModal({
          open: true,
          title: status === 401 ? 'Sessão expirada' : 'Erro ao carregar detalhes',
          desc: status === 401 ? 'Faça login novamente para continuar.' : (err?.message || 'Tente novamente mais tarde.'),
          toLogin: status === 401,
        });
      }
    }
  };

  const handleRunMaintenance = async () => {
    setRunning(true);
    try {
      await api.post('/cases/scheduler/run-maintenance');
      await fetchExecutions();
      await fetchStatistics();
    } catch (err: any) {
      console.error('Erro ao executar varredura:', err);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        const status = err?.response?.status;
        setErrorModal({
          open: true,
          title: status === 401 ? 'Sessão expirada' : 'Falha na varredura',
          desc: status === 401 ? 'Faça login novamente para continuar.' : (err?.message || 'Tente novamente mais tarde.'),
          toLogin: status === 401,
        });
      }
    } finally {
      setRunning(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (executionType) params.execution_type = executionType;

      const response = await api.get(`/sla-audit/export.csv`, { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sla_executions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao exportar CSV:', err);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        const status = err?.response?.status;
        setErrorModal({
          open: true,
          title: status === 401 ? 'Sessão expirada' : 'Erro ao exportar',
          desc: status === 401 ? 'Faça login novamente para continuar.' : (err?.message || 'Tente novamente mais tarde.'),
          toLogin: status === 401,
        });
      }
    }
  };

  useEffect(() => {
    fetchExecutions();
    fetchStatistics();
  }, [page, dateFrom, dateTo, executionType]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Auditoria de SLA</h1>
          <p className="text-slate-400 mt-1">
            Histórico de execuções do sistema de verificação de casos expirados (48h úteis)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchExecutions} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button onClick={handleRunMaintenance} variant="secondary" disabled={running}>
            <Play className="w-4 h-4 mr-2" />
            {running ? 'Varredura...' : 'Varredura de Casos'}
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Total de Execuções</p>
                  <p className="text-3xl font-bold text-white mt-2">{statistics.total_executions}</p>
                  <p className="text-xs text-blue-300/70 mt-1">Últimos 30 dias</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-300">Casos Expirados</p>
                  <p className="text-3xl font-bold text-white mt-2">{statistics.total_cases_expired}</p>
                  <p className="text-xs text-orange-300/70 mt-1">Total no período</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Média por Execução</p>
                  <p className="text-3xl font-bold text-white mt-2">{statistics.avg_cases_per_execution}</p>
                  <p className="text-xs text-green-300/70 mt-1">Casos processados</p>
                </div>
                <Calendar className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Duração Média</p>
                  <p className="text-3xl font-bold text-white mt-2">{statistics.avg_duration_seconds.toFixed(1)}s</p>
                  <p className="text-xs text-purple-300/70 mt-1">Tempo de execução</p>
                </div>
                <Clock className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data Inicial
              </label>
              <input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data Final
              </label>
              <input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Execução
              </label>
              <select
                value={executionType}
                onChange={(e) => setExecutionType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="scheduled">Agendado</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Execuções */}
      <SLAExecutionsTable
        executions={executions}
        onViewDetails={handleViewDetails}
        loading={loading}
      />

      {/* Modal de Detalhes */}
      <SLAExecutionDetailsModal
        execution={selectedExecution}
        open={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
      />

      {/* Modal de erro (Design System) */}
      <Dialog open={errorModal.open} onOpenChange={(o)=>setErrorModal(s=>({ ...s, open:o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorModal.title}</DialogTitle>
            <DialogDescription>{errorModal.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {errorModal.toLogin ? (
              <Button onClick={()=>router.push('/login')}>Ir para login</Button>
            ) : null}
            <Button variant="outline" onClick={()=>setErrorModal(s=>({ ...s, open:false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
