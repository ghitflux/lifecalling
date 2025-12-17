"use client";

/* apps/web/src/components/ImportMonitoringDashboard.tsx */
import React, { useState, useEffect } from 'react';
import { Card } from '@lifecalling/ui';
import { Button } from '@lifecalling/ui';
import { StatusBadge } from '@lifecalling/ui';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Database, Users } from 'lucide-react';

interface ImportHealthData {
  health_status: string;
  last_24_hours: {
    imports_santander: number;
    imports_payroll: number;
    errors_santander: number;
    errors_payroll: number;
    total_imports: number;
    total_errors: number;
    error_rate: number;
  };
  pipeline: {
    available_cases: number;
    total_cases: number;
    availability_rate: number;
  };
  timestamp: string;
}

interface BatchValidation {
  is_valid: boolean;
  warnings: string[];
  errors: string[];
  statistics: {
    batch_id: number;
    filename?: string;
    file_name?: string;
    total_rows?: number;
    success_rows?: number;
    error_rows?: number;
    error_rate?: number;
    cases_created?: number;
    available_cases?: number;
    batch_type: string;
  };
}

export function ImportMonitoringDashboard() {
  const [healthData, setHealthData] = useState<ImportHealthData | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [batchValidation, setBatchValidation] = useState<BatchValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/imports/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const validateBatch = async (batchId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/imports/validate/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setBatchValidation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar batch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'WARNING': return 'text-yellow-600';
      case 'CRITICAL': return 'text-red-600';
      case 'NO_ACTIVITY': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'GOOD': return <CheckCircle className="h-6 w-6 text-blue-600" />;
      case 'WARNING': return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'CRITICAL': return <XCircle className="h-6 w-6 text-red-600" />;
      case 'NO_ACTIVITY': return <Database className="h-6 w-6 text-gray-600" />;
      default: return <Database className="h-6 w-6 text-gray-600" />;
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Erro ao carregar dados</span>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
        <Button onClick={fetchHealthData} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando dados de monitoramento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Importações</h1>
            <p className="text-gray-600">Status da esteira e validação de dados</p>
          </div>
        </div>
        <Button
          onClick={fetchHealthData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Geral */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {getHealthIcon(healthData.health_status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Status Geral</h2>
              <p className={`text-lg font-medium ${getHealthStatusColor(healthData.health_status)}`}>
                {healthData.health_status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Importações (24h)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {healthData.last_24_hours.total_imports}
              </div>
              <div className="text-sm text-gray-600">
                Santander: {healthData.last_24_hours.imports_santander} |
                Payroll: {healthData.last_24_hours.imports_payroll}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Taxa de Erro</span>
              </div>
              <div className={`text-2xl font-bold ${
                healthData.last_24_hours.error_rate > 10 ? 'text-red-600' :
                healthData.last_24_hours.error_rate > 5 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {healthData.last_24_hours.error_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                {healthData.last_24_hours.total_errors} de {healthData.last_24_hours.total_imports} importações
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">Esteira</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {healthData.pipeline.available_cases}
              </div>
              <div className="text-sm text-gray-600">
                {healthData.pipeline.availability_rate.toFixed(1)}% do total ({healthData.pipeline.total_cases})
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalhes das Importações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Santander (Últimas 24h)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Importações realizadas</span>
                <span className="font-medium">{healthData.last_24_hours.imports_santander}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Erros encontrados</span>
                <span className={`font-medium ${
                  healthData.last_24_hours.errors_santander > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {healthData.last_24_hours.errors_santander}
                </span>
              </div>
              {healthData.last_24_hours.imports_santander > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa de erro</span>
                  <span className={`font-medium ${
                    (healthData.last_24_hours.errors_santander / healthData.last_24_hours.imports_santander * 100) > 5
                    ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {((healthData.last_24_hours.errors_santander / healthData.last_24_hours.imports_santander) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll (Últimas 24h)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Importações realizadas</span>
                <span className="font-medium">{healthData.last_24_hours.imports_payroll}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Erros encontrados</span>
                <span className={`font-medium ${
                  healthData.last_24_hours.errors_payroll > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {healthData.last_24_hours.errors_payroll}
                </span>
              </div>
              {healthData.last_24_hours.imports_payroll > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa de erro</span>
                  <span className={`font-medium ${
                    (healthData.last_24_hours.errors_payroll / healthData.last_24_hours.imports_payroll * 100) > 5
                    ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {((healthData.last_24_hours.errors_payroll / healthData.last_24_hours.imports_payroll) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Validação de Batch Específico */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validação de Batch</h3>
          <div className="flex gap-4 mb-4">
            <input
              type="number"
              placeholder="ID do Batch"
              className="border border-gray-300 rounded px-3 py-2"
              onChange={(e) => setSelectedBatch(e.target.value ? parseInt(e.target.value) : null)}
            />
            <Button
              onClick={() => selectedBatch && validateBatch(selectedBatch)}
              disabled={!selectedBatch || loading}
            >
              Validar Batch
            </Button>
          </div>

          {batchValidation && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={batchValidation.is_valid ? 'success' : 'error'} />
                <span className="font-medium">
                  Batch {batchValidation.statistics.batch_id} ({batchValidation.statistics.batch_type})
                </span>
              </div>

              {/* Estatísticas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Estatísticas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {batchValidation.statistics.total_rows && (
                    <div>
                      <span className="text-gray-600">Total de linhas:</span>
                      <div className="font-medium">{batchValidation.statistics.total_rows}</div>
                    </div>
                  )}
                  {batchValidation.statistics.success_rows && (
                    <div>
                      <span className="text-gray-600">Sucesso:</span>
                      <div className="font-medium text-green-600">{batchValidation.statistics.success_rows}</div>
                    </div>
                  )}
                  {batchValidation.statistics.error_rows !== undefined && (
                    <div>
                      <span className="text-gray-600">Erros:</span>
                      <div className="font-medium text-red-600">{batchValidation.statistics.error_rows}</div>
                    </div>
                  )}
                  {batchValidation.statistics.cases_created !== undefined && (
                    <div>
                      <span className="text-gray-600">Casos criados:</span>
                      <div className="font-medium">{batchValidation.statistics.cases_created}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {batchValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Avisos
                  </h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {batchValidation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {batchValidation.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Erros
                  </h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {batchValidation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Última atualização: {new Date(healthData.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}