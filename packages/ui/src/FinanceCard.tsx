/* packages/ui/src/FinanceCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, TrendingUp, AlertCircle, CreditCard, Upload, FileText, Eye, X, Trash2, XCircle, Download, FileImage, File } from "lucide-react";

interface SimulationResult {
  banco?: string;
  valorLiberado: number;
  valorParcela: number;
  coeficiente?: number;
  saldoDevedor?: number;
  valorTotalFinanciado?: number;
  seguroObrigatorio?: number;
  valorLiquido?: number;
  custoConsultoria?: number;
  custoConsultoriaLiquido?: number;
  liberadoCliente: number;
  percentualConsultoria?: number;
  taxaJuros: number;
  prazo: number;
}

export interface FinanceCardProps {
  id: number;
  clientName: string;
  simulationResult?: SimulationResult;
  // Mantendo compatibilidade com props antigas
  totalAmount?: number;
  installedAmount?: number;
  installments?: number;
  paidInstallments?: number;
  status: "pending" | "approved" | "disbursed" | "overdue";
  dueDate?: string;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDisburse?: (id: number) => void;
  onCancel?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
  // Dados bancários do cliente
  clientBankInfo?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    chave_pix?: string;
    tipo_chave_pix?: string;
  };
  // Anexos do contrato
  attachments?: Array<{
    id: number;
    filename: string;
    size: number;
    uploaded_at: string;
    mime_type?: string;
    url?: string;
  }>;
  // Função para upload de comprovantes
  onUploadAttachment?: (file: File) => void;
  isUploadingAttachment?: boolean;
  // Dados completos do caso para o modal
  caseDetails?: {
    cpf?: string;
    matricula?: string;
    created_at?: string;
    events?: Array<{
      type: string;
      created_at: string;
      payload?: any;
    }>;
  };
}

export function FinanceCard({
  id,
  clientName,
  simulationResult,
  totalAmount,
  installedAmount = 0,
  installments,
  paidInstallments = 0,
  status,
  dueDate,
  onApprove,
  onReject,
  onDisburse,
  onCancel,
  onDelete,
  className,
  clientBankInfo,
  attachments = [],
  onUploadAttachment,
  isUploadingAttachment = false,
  caseDetails
}: FinanceCardProps) {
  // Usar dados da simulação quando disponível, caso contrário usar props antigas
  const finalTotalAmount = simulationResult?.valorLiberado || totalAmount || 0;
  const finalInstallments = simulationResult?.prazo || installments || 0;
  const finalMonthlyPayment = simulationResult?.valorParcela || 0;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const progress = finalInstallments > 0 ? (paidInstallments / finalInstallments) * 100 : 0;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadAttachment) {
      onUploadAttachment(file);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && onUploadAttachment) {
      onUploadAttachment(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (filename: string, mimeType?: string) => {
    if (mimeType?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return <FileImage className="h-4 w-4" />;
    }
    if (mimeType?.includes('pdf') || filename.endsWith('.pdf')) {
      return <File className="h-4 w-4 text-danger" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusColors = {
    pending: "border-warning/40 bg-warning-subtle text-warning-foreground",
    approved: "border-success/40 bg-success-subtle text-success-foreground",
    disbursed: "border-info/40 bg-info-subtle text-info-foreground",
    overdue: "border-danger/40 bg-danger-subtle text-danger-foreground"
  } as const;

  const statusLabels = {
    pending: "Pendente",
    approved: "Aprovado",
    disbursed: "Liberado",
    overdue: "Em atraso"
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{clientName}</h3>
          <p className="text-sm text-muted-foreground">Caso #{id}</p>
          {simulationResult?.banco && (
            <div className="bg-primary/10 px-2 py-1 rounded-md">
              <span className="text-xs font-medium text-primary">{simulationResult.banco}</span>
            </div>
          )}
        </div>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Valor Liberado</span>
          </div>
          <p className="text-lg font-semibold text-success">
            {formatCurrency(finalTotalAmount)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-info" />
            <span className="text-sm text-muted-foreground">Parcelas</span>
          </div>
          <p className="font-semibold">
            {paidInstallments}/{finalInstallments}
          </p>
        </div>

        {simulationResult && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-info" />
                <span className="text-sm text-muted-foreground">Valor Parcela</span>
              </div>
              <p className="font-semibold">
                {formatCurrency(finalMonthlyPayment)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Liberado Cliente</span>
              </div>
              <p className="font-semibold text-success">
                {formatCurrency(simulationResult.liberadoCliente)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Seção adicional com dados da simulação */}
      {simulationResult && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {simulationResult.valorTotalFinanciado && (
              <div>
                <span className="text-muted-foreground">Total Financiado: </span>
                <span className="font-medium">{formatCurrency(simulationResult.valorTotalFinanciado)}</span>
              </div>
            )}
            {simulationResult.custoConsultoria && (
              <div>
                <span className="text-muted-foreground">Custo Consultoria: </span>
                <span className="font-medium">{formatCurrency(simulationResult.custoConsultoria)}</span>
              </div>
            )}
            {simulationResult.custoConsultoriaLiquido && (
              <div>
                <span className="text-muted-foreground">Custo Consultoria Líquido (86%): </span>
                <span className="font-medium">{formatCurrency(simulationResult.custoConsultoriaLiquido)}</span>
              </div>
            )}
            {simulationResult.taxaJuros && (
              <div>
                <span className="text-muted-foreground">Taxa Juros: </span>
                <span className="font-medium">{simulationResult.taxaJuros}% a.m.</span>
              </div>
            )}
            {simulationResult.coeficiente && (
              <div>
                <span className="text-muted-foreground">Coeficiente: </span>
                <span className="font-mono font-medium">{simulationResult.coeficiente.toFixed(7)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações Bancárias do Cliente */}


      {/* Seção de Anexos - Apenas para contratos efetivados */}
      {status === "disbursed" && (
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Comprovantes ({attachments.length})</span>
            </div>
            {onUploadAttachment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="h-7 px-2 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                {isUploadingAttachment ? "Enviando..." : "Anexar"}
              </Button>
            )}
          </div>

          {/* Área de drop */}
          {onUploadAttachment && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-gray-300",
                "hover:border-primary hover:bg-primary/5"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-600">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
            </div>
          )}

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            multiple
          />

          {/* Lista de anexos */}
          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.slice(0, 2).map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(attachment.filename, attachment.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {attachment.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {attachments.length > 2 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetailsModal(true)}
                  className="w-full text-xs"
                >
                  Ver todos os {attachments.length} anexos
                </Button>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">
              Nenhum comprovante anexado
            </div>
          )}
        </div>
      )}

      {/* Progress Bar for disbursed contracts */}
      {status === "disbursed" && (
        <div className="space-y-2">
          <ProgressBar
            value={paidInstallments}
            max={finalInstallments}
            variant={progress < 30 ? "danger" : progress < 70 ? "warning" : "success"}
            showLabel
            label="Progresso de Pagamento"
          />
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Vencimento: {formatDate(dueDate)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {status === "pending" && (onApprove || onReject) && (
          <>
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(id)}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            )}
          </>
        )}

        {status === "approved" && onDisburse && (
          <div className="w-full space-y-3">
            <div className="rounded-lg border border-info/40 bg-info-subtle p-3 space-y-2">
              <h4 className="text-sm font-medium text-info">Valores da Simulação</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor a Liberar:</span>
                  <div className="font-semibold text-success">{formatCurrency(finalTotalAmount)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Parcelas:</span>
                  <div className="font-semibold">{finalInstallments}x</div>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onDisburse(id)}
              className="w-full"
            >
              Efetivar Liberação
            </Button>
          </div>
        )}

        {/* Botões de ação para contratos efetivados */}
        {status === "disbursed" && (onCancel || onDelete) && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetailsModal(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
            {onCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="text-warning hover:text-warning"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Deletar
              </Button>
            )}
          </div>
        )}

        {status === "overdue" && (
          <div className="flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Necessita atenção - Pagamento em atraso</span>
          </div>
        )}
      </div>

      {/* Modal de Detalhes Completos */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento #{id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados do Cliente</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{clientName}</p>
                  </div>
                  {caseDetails?.cpf && (
                    <div>
                      <span className="text-sm text-muted-foreground">CPF:</span>
                      <p className="font-medium">{caseDetails.cpf}</p>
                    </div>
                  )}
                  {caseDetails?.matricula && (
                    <div>
                      <span className="text-sm text-muted-foreground">Matrícula:</span>
                      <p className="font-medium">{caseDetails.matricula}</p>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* Dados Financeiros */}
            {simulationResult && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalhes Financeiros</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-success/40 bg-success-subtle p-3">
                    <span className="text-xs font-medium text-success">Valor Liberado</span>
                    <p className="font-bold text-card-foreground">{formatCurrency(simulationResult.valorLiberado)}</p>
                  </div>
                  <div className="rounded-lg border border-info/40 bg-info-subtle p-3">
                    <span className="text-xs font-medium text-info">Liberado Cliente</span>
                    <p className="font-bold text-card-foreground">{formatCurrency(simulationResult.liberadoCliente)}</p>
                  </div>
                  <div className="rounded-lg border border-accent/40 bg-accent-subtle p-3">
                    <span className="text-xs font-medium text-accent">Valor Parcela</span>
                    <p className="font-bold text-card-foreground">{formatCurrency(simulationResult.valorParcela)}</p>
                  </div>
                  <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3">
                    <span className="text-xs font-medium text-warning">Prazo</span>
                    <p className="font-bold text-card-foreground">{simulationResult.prazo} meses</p>
                  </div>
                </div>
              </div>
            )}

            {/* Todos os Anexos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Documentos Anexados ({attachments.length})</h3>
              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/40 p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(attachment.filename, attachment.mime_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {attachment.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum documento anexado</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Operação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar a operação para <strong>{clientName}</strong>?
              Esta ação pode ser reversível dependendo do status atual.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onCancel?.(id);
                  setShowCancelConfirm(false);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar Operação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Operação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-danger/40 bg-danger-subtle p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Ação Irreversível</p>
                  <p className="mt-1 text-sm text-danger-foreground">
                    Deletar a operação de <strong>{clientName}</strong> removerá permanentemente todos os dados,
                    incluindo anexos e histórico. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete?.(id);
                  setShowDeleteConfirm(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Deletar Permanentemente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
