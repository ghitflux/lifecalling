"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImportacaoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Query para listar importações
  const { data: imports = [] } = useQuery({
    queryKey: ["imports"],
    queryFn: async () => {
      const response = await api.get("/imports/batches");
      return response.data.batches || [];
    },
    refetchInterval: 5000 // Refetch a cada 5 segundos
  });

  // Mutation para upload de arquivo
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/imports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const counters = data.counters || {};
      const summary = data.summary || {};

      // Mensagem principal de sucesso com mais detalhes
      toast.success(
        `✓ Importação concluída com sucesso!\n` +
        `• ${counters.clients_created || 0} clientes criados\n` +
        `• ${counters.clients_updated || 0} clientes atualizados\n` +
        `• ${counters.cases_created || 0} casos na esteira\n` +
        `• ${counters.lines_created || 0} linhas processadas\n` +
        `• Taxa de sucesso: ${summary.success_rate || '100%'}`,
        { duration: 6000 }
      );

      // Mostrar informação adicional se houver
      if (data.info) {
        toast.info(data.info, { duration: 6000 });
      }

      // Avisar sobre erros se houver
      if (counters.errors && counters.errors > 0) {
        toast.warning(
          `⚠ Atenção: ${counters.errors} linhas com erro foram ignoradas.\n` +
          `Verifique o formato do arquivo e tente novamente se necessário.`,
          { duration: 7000 }
        );
      }

      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const handleDownload = async (batchId: number, filename: string) => {
    try {
      // Fazer request para o endpoint de download
      const response = await api.get(`/imports/batches/${batchId}/download`, {
        responseType: 'blob'
      });

      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download iniciado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer download:', error);
      toast.error(error.response?.data?.detail || 'Erro ao fazer download do arquivo');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importação de Dados</h1>
          <p className="text-muted-foreground">
            Importe planilhas de clientes e casos para o sistema
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivo
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Selecionar Arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Formato aceito: Arquivo de texto (.txt) - Layout iNETConsig
            </p>
          </div>

          {selectedFile && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="ml-auto"
                >
                  {uploadMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Import History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Importações</h2>

        {imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma importação encontrada</p>
            <p className="text-sm">Envie um arquivo para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {imports.map((importItem: any) => (
              <div
                key={importItem.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{importItem.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {importItem.entity_name} • Ref: {importItem.reference}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(importItem.created_at).toLocaleString()} por {importItem.created_by}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status - sempre concluído para payroll */}
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Processado
                  </Badge>

                  {/* Entidade Code */}
                  <Badge variant="outline">
                    {importItem.entity_code}
                  </Badge>

                  {/* Download button */}
                  {importItem.has_file && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(importItem.id, importItem.filename)}
                      title="Fazer download do arquivo original"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          Instruções para Importação de Folha de Pagamento
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Arquivo deve estar no formato TXT de folha de pagamento (layout de colunas fixas)</p>
          <p>• Cabeçalho deve conter: Entidade, Referência (MM/AAAA) e Data da Geração</p>
          <p>• Chave primária: CPF + Matrícula (clientes duplicados serão atualizados)</p>
          <p>• Financiamentos são versionados por Entidade + Mês/Ano de referência</p>
          <p>• O sistema extrai automaticamente: cargo, fin, órgão, valores, parcelas, etc.</p>
          <p>• Importações criam casos automaticamente na esteira com status &quot;novo&quot;</p>
        </div>
      </Card>
    </div>
  );
}