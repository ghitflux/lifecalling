"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/ProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkCadastroImport from "@/components/BulkCadastroImport";
import { formatDateTimeBR } from "@/lib/timezone";

export default function ImportacaoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "error">("idle");
  const [importStats, setImportStats] = useState<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Estados para SIAPE
  const [selectedFileSiape, setSelectedFileSiape] = useState<File | null>(null);
  const [uploadProgressSiape, setUploadProgressSiape] = useState(0);
  const [uploadStatusSiape, setUploadStatusSiape] = useState<"idle" | "uploading" | "processing" | "completed" | "error">("idle");
  const [importStatsSiape, setImportStatsSiape] = useState<any>(null);
  const progressIntervalSiape = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Query para listar importações INET
  const { data: imports = [] } = useQuery({
    queryKey: ["imports"],
    queryFn: async () => {
      const response = await api.get("/imports/batches");
      return response.data.batches || [];
    },
    refetchInterval: 5000 // Refetch a cada 5 segundos
  });

  // Query para listar importações SIAPE
  const { data: siapeImports = [] } = useQuery({
    queryKey: ["siapeImports"],
    queryFn: async () => {
      const response = await api.get("/imports/siape/batches");
      return response.data.batches || [];
    },
    refetchInterval: 5000
  });

  // Cleanup do intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (progressIntervalSiape.current) {
        clearInterval(progressIntervalSiape.current);
      }
    };
  }, []);

  // Simular progresso de upload e processamento
  const startProgressSimulation = (totalDuration: number) => {
    setUploadProgress(0);
    setUploadStatus("uploading");

    let progress = 0;
    const uploadDuration = totalDuration * 0.2; // 20% para upload
    const processingDuration = totalDuration * 0.8; // 80% para processamento

    // Fase de upload (0-20%)
    const uploadInterval = setInterval(() => {
      progress += 2;
      setUploadProgress(Math.min(progress, 20));

      if (progress >= 20) {
        clearInterval(uploadInterval);
        setUploadStatus("processing");

        // Fase de processamento (20-95%)
        const processingInterval = setInterval(() => {
          progress += 1;
          setUploadProgress(Math.min(progress, 95));

          if (progress >= 95) {
            clearInterval(processingInterval);
          }
        }, processingDuration / 75);

        progressInterval.current = processingInterval;
      }
    }, uploadDuration / 10);
  };

  // Mutation para upload de arquivo
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Estimar duração baseado no tamanho do arquivo
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedDuration = Math.max(2000, fileSizeMB * 500); // mínimo 2s

      startProgressSimulation(estimatedDuration);

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

      // Completar progresso
      setUploadProgress(100);
      setUploadStatus("completed");

      // Armazenar stats para exibir
      setImportStats({
        clients_created: counters.clients_created || 0,
        clients_updated: counters.clients_updated || 0,
        cases_created: counters.cases_created || 0,
        lines_processed: counters.lines_created || 0,
      });

      // Limpar intervalo
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

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
        const infoMessage = typeof data.info === 'string' ? data.info : JSON.stringify(data.info);
        toast.info(infoMessage, { duration: 6000 });
      }

      // Avisar sobre erros se houver
      if (counters.errors && counters.errors > 0) {
        toast.warning(
          `⚠ Atenção: ${counters.errors} linhas com erro foram ignoradas.\n` +
          `Verifique o formato do arquivo e tente novamente se necessário.`,
          { duration: 7000 }
        );
      }

      // Resetar após alguns segundos
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setImportStats(null);
      }, 5000);

      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: any) => {
      setUploadStatus("error");
      setUploadProgress(0);

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo");

      setTimeout(() => {
        setUploadStatus("idle");
      }, 3000);
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

  // ========== FUNÇÕES SIAPE ==========

  const startProgressSimulationSiape = (totalDuration: number) => {
    setUploadProgressSiape(0);
    setUploadStatusSiape("uploading");

    let progress = 0;
    const uploadDuration = totalDuration * 0.2;
    const processingDuration = totalDuration * 0.8;

    const uploadInterval = setInterval(() => {
      progress += 2;
      setUploadProgressSiape(Math.min(progress, 20));

      if (progress >= 20) {
        clearInterval(uploadInterval);
        setUploadStatusSiape("processing");

        const processingInterval = setInterval(() => {
          progress += 1;
          setUploadProgressSiape(Math.min(progress, 95));

          if (progress >= 95) {
            clearInterval(processingInterval);
          }
        }, processingDuration / 75);

        progressIntervalSiape.current = processingInterval;
      }
    }, uploadDuration / 10);
  };

  const uploadMutationSiape = useMutation({
    mutationFn: async (file: File) => {
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedDuration = Math.max(3000, fileSizeMB * 1000);

      startProgressSimulationSiape(estimatedDuration);

      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/imports/siape", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const stats = data.statistics || {};

      setUploadProgressSiape(100);
      setUploadStatusSiape("completed");

      setImportStatsSiape({
        clients_created: stats.clients_created || 0,
        clients_updated: stats.clients_updated || 0,
        cases_created: stats.cases_created || 0,
        lines_processed: stats.total_lines || 0,
      });

      if (progressIntervalSiape.current) {
        clearInterval(progressIntervalSiape.current);
      }

      toast.success(
        `✓ Importação SIAPE concluída com sucesso!\n` +
        `• ${stats.clients_created || 0} clientes criados\n` +
        `• ${stats.clients_updated || 0} clientes atualizados\n` +
        `• ${stats.cases_created || 0} casos na esteira\n` +
        `• ${stats.total_lines || 0} linhas processadas`,
        { duration: 6000 }
      );

      if (stats.errors && stats.errors > 0) {
        toast.warning(
          `⚠ Atenção: ${stats.errors} linhas com erro foram ignoradas.`,
          { duration: 7000 }
        );
      }

      setTimeout(() => {
        setSelectedFileSiape(null);
        setUploadStatusSiape("idle");
        setUploadProgressSiape(0);
        setImportStatsSiape(null);
      }, 5000);

      queryClient.invalidateQueries({ queryKey: ["siapeImports"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: any) => {
      setUploadStatusSiape("error");
      setUploadProgressSiape(0);

      if (progressIntervalSiape.current) {
        clearInterval(progressIntervalSiape.current);
      }

      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo SIAPE");

      setTimeout(() => {
        setUploadStatusSiape("idle");
      }, 3000);
    },
  });

  const handleFileSelectSiape = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileSiape(file);
    }
  };

  const handleUploadSiape = () => {
    if (selectedFileSiape) {
      uploadMutationSiape.mutate(selectedFileSiape);
    }
  };

  const handleDownloadSiape = async (batchId: number, filename: string) => {
    try {
      const response = await api.get(`/imports/siape/batches/${batchId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download SIAPE iniciado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer download SIAPE:', error);
      toast.error(error.response?.data?.detail || 'Erro ao fazer download do arquivo SIAPE');
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

      {/* Tabs */}
      <Tabs defaultValue="contracheques" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contracheques">INET Contracheques</TabsTrigger>
          <TabsTrigger value="siape">SIAPE</TabsTrigger>
          <TabsTrigger value="cadastro">Atualização Cadastral</TabsTrigger>
        </TabsList>

        <TabsContent value="contracheques" className="space-y-6">
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

          {selectedFile && uploadStatus === "idle" && (
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

          {/* Barra de Progresso */}
          {(uploadStatus === "uploading" || uploadStatus === "processing" || uploadStatus === "completed") && (
            <ProgressBar
              progress={uploadProgress}
              status={uploadStatus}
              stats={importStats}
            />
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
                      {formatDateTimeBR(importItem.created_at)} por {importItem.created_by}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status com total de clientes */}
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3" />
                    <span>Processado</span>
                    {importItem.total_clients !== undefined && (
                      <span className="ml-1 font-semibold">
                        {importItem.total_clients.toLocaleString()}
                      </span>
                    )}
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
        </TabsContent>

        {/* TAB SIAPE */}
        <TabsContent value="siape" className="space-y-6">
          {/* Upload Section SIAPE */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivo SIAPE
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload-siape">Selecionar Arquivo SIAPE</Label>
                <Input
                  id="file-upload-siape"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelectSiape}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Formato aceito: Planilha Excel (.xlsx ou .xls) - Dados SIAPE
                </p>
              </div>

              {selectedFileSiape && uploadStatusSiape === "idle" && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedFileSiape.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFileSiape.size)}
                      </p>
                    </div>
                    <Button
                      onClick={handleUploadSiape}
                      disabled={uploadMutationSiape.isPending}
                      className="ml-auto bg-green-600 hover:bg-green-700"
                    >
                      {uploadMutationSiape.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Barra de Progresso SIAPE */}
              {(uploadStatusSiape === "uploading" || uploadStatusSiape === "processing" || uploadStatusSiape === "completed") && (
                <ProgressBar
                  progress={uploadProgressSiape}
                  status={uploadStatusSiape}
                  stats={importStatsSiape}
                />
              )}
            </div>
          </Card>

          {/* Histórico SIAPE */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Importações SIAPE</h2>

            {siapeImports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma importação SIAPE encontrada</p>
                <p className="text-sm">Envie um arquivo para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {siapeImports.map((importItem: any) => (
                  <div
                    key={importItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{importItem.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {importItem.entity_name} • Ref: {importItem.reference}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTimeBR(importItem.created_at)} por {importItem.created_by}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status */}
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" />
                        <span>Processado</span>
                        <span className="ml-1 font-semibold">
                          {importItem.processed_lines?.toLocaleString() || 0}
                        </span>
                      </Badge>

                      {/* Tag SIAPE */}
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        SIAPE
                      </Badge>

                      {/* Download button */}
                      {importItem.has_file !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadSiape(importItem.id, importItem.filename)}
                          title="Fazer download do arquivo SIAPE original"
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

          {/* Instruções SIAPE */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold mb-3 text-green-900">
              Instruções para Importação SIAPE
            </h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>• Arquivo deve estar no formato Excel (.xlsx ou .xls)</p>
              <p>• Colunas obrigatórias: CPF, Nome, Matrícula, Banco Empréstimo</p>
              <p>• Colunas opcionais: Nascimento, Idade, Prazo, Valor Parcela, Saldo Devedor, Telefone, E-mail, Endereço</p>
              <p>• Chave primária: CPF + Matrícula (clientes duplicados serão atualizados)</p>
              <p>• Cada linha gera um caso na esteira com status &quot;novo&quot;</p>
              <p>• Clientes SIAPE são marcados com tag especial para identificação</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cadastro" className="space-y-6">
          <BulkCadastroImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
