"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface CadastroRow {
  cpf: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
}

interface ImportResult {
  total_rows: number;
  success_count: number;
  error_count: number;
  not_found_count: number;
  errors: Array<{
    row: number;
    cpf: string;
    error: string;
  }>;
  success_details: Array<{
    row: number;
    cpf: string;
    client_name: string;
    updates: string[];
  }>;
}

export default function BulkCadastroImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CadastroRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);

    // Parse CSV para preview
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        setPreview(rows.slice(0, 5)); // Primeiras 5 linhas
        setShowPreview(true);
      },
      error: (error) => {
        toast.error(`Erro ao ler arquivo: ${error.message}`);
      }
    });
  }, []);

  const importMutation = useMutation({
    mutationFn: async (rows: CadastroRow[]) => {
      const response = await api.post("/clients/bulk-update-cadastro", rows);
      return response.data as ImportResult;
    },
    onSuccess: (data) => {
      setImportResult(data);

      if (data.error_count === 0 && data.not_found_count === 0) {
        toast.success(`Importação concluída! ${data.success_count} registros atualizados.`);
      } else {
        toast.warning(`Importação concluída com alguns problemas. Veja o relatório abaixo.`);
      }
    },
    onError: (error: any) => {
      toast.error(`Erro na importação: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleImport = () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as CadastroRow[];

        // Validar que tem a coluna cpf
        if (rows.length > 0 && !('cpf' in rows[0])) {
          toast.error("Arquivo CSV deve ter a coluna 'cpf'");
          return;
        }

        importMutation.mutate(rows);
      },
      error: (error) => {
        toast.error(`Erro ao processar arquivo: ${error.message}`);
      }
    });
  };

  const downloadReport = () => {
    if (!importResult) return;

    const csv = Papa.unparse([
      ...importResult.success_details.map(s => ({
        Status: 'Sucesso',
        Linha: s.row,
        CPF: s.cpf,
        Cliente: s.client_name,
        Atualizações: s.updates.join('; ')
      })),
      ...importResult.errors.map(e => ({
        Status: 'Erro',
        Linha: e.row,
        CPF: e.cpf,
        Cliente: '-',
        Erro: e.error
      }))
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-importacao-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Card de Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Importação de Dados Cadastrais</h3>
            <p className="text-sm text-muted-foreground">
              Atualize telefones e endereços dos clientes através de arquivo CSV
            </p>
          </div>

          {/* Formato esperado */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Formato do CSV:</p>
            <code className="text-xs block bg-background p-2 rounded">
              cpf,telefone,cidade,estado<br />
              12345678901,11999999999,São Paulo,SP<br />
              98765432100,21988888888,Rio de Janeiro,RJ
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              • CPF: obrigatório (apenas números)<br />
              • Telefone: opcional (com DDD, apenas números)<br />
              • Cidade: opcional<br />
              • Estado: opcional (sigla com 2 letras)
            </p>
          </div>

          {/* Input de arquivo */}
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : "Selecione um arquivo CSV"}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {showPreview && preview.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium mb-3">Preview (primeiras 5 linhas)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">CPF</th>
                  <th className="text-left p-2">Telefone</th>
                  <th className="text-left p-2">Cidade</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.cpf || '-'}</td>
                    <td className="p-2">{row.telefone || '-'}</td>
                    <td className="p-2">{row.cidade || '-'}</td>
                    <td className="p-2">{row.estado || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Resultado */}
      {importResult && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Relatório de Importação</h4>
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  Total
                </div>
                <div className="text-2xl font-bold">{importResult.total_rows}</div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  Sucesso
                </div>
                <div className="text-2xl font-bold text-green-700">{importResult.success_count}</div>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
                  <XCircle className="h-4 w-4" />
                  Erros
                </div>
                <div className="text-2xl font-bold text-red-700">{importResult.error_count}</div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-sm text-yellow-700 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Não Encontrados
                </div>
                <div className="text-2xl font-bold text-yellow-700">{importResult.not_found_count}</div>
              </div>
            </div>

            {/* Erros */}
            {importResult.errors.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2">Erros ({importResult.errors.length})</h5>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, idx) => (
                    <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium">Linha {error.row} - CPF: {error.cpf}</div>
                      <div className="text-red-700">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sucessos */}
            {importResult.success_details.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">
                  Registros Atualizados ({importResult.success_details.length})
                </h5>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importResult.success_details.slice(0, 10).map((success, idx) => (
                    <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <div className="font-medium">{success.client_name} (CPF: {success.cpf})</div>
                      <div className="text-green-700 text-xs">
                        {success.updates.join(', ')}
                      </div>
                    </div>
                  ))}
                  {importResult.success_details.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center">
                      + {importResult.success_details.length - 10} registros...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
