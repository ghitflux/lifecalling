/* packages/ui/src/FinanceCard.tsx */
import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { Badge } from "./Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, TrendingUp, AlertCircle, CreditCard, Upload, FileText, Eye, X, Trash2, XCircle, Download, FileImage, File, ArrowLeft } from "lucide-react";

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
  onReturnToCalc?: (id: number) => void;
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
  // Dados completos do caso (do endpoint /finance/case/{id})
  fullCaseDetails?: {
    id: number;
    status: string;
    created_at: string;
    client: {
      id: number;
      name: string;
      cpf: string;
      matricula: string;
      orgao?: string;
      telefone_preferencial?: string;
      numero_cliente?: string;
      observacoes?: string;
      banco?: string;
      agencia?: string;
      conta?: string;
      chave_pix?: string;
      tipo_chave_pix?: string;
    };
    simulation?: {
      id: number;
      prazo: number;
      coeficiente: string;
      seguro: number;
      percentual_consultoria: number;
      banks_json: any[];
      totals: {
        valorParcelaTotal: number;
        saldoTotal: number;
        liberadoTotal: number;
        totalFinanciado: number;
        valorLiquido: number;
        custoConsultoria: number;
        custoConsultoriaLiquido: number;
        liberadoCliente: number;
      };
    };
    contract?: {
      id: number;
      total_amount: number;
      installments: number;
      disbursed_at: string;
      status: string;
      attachments: Array<{
        id: number;
        filename: string;
        size: number;
        mime: string;
        created_at: string;
      }>;
    };
    events: Array<{
      id: number;
      type: string;
      created_at: string;
      payload: any;
      created_by: number;
    }>;
    attachments: Array<{
      id: number;
      path: string;
      mime: string;
      size: number;
      created_at: string;
    }>;
  };
  // Callback para carregar detalhes completos
  onLoadFullDetails?: (caseId: number) => void;
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
  onReturnToCalc,
  className,
  clientBankInfo,
  attachments = [],
  onUploadAttachment,
  isUploadingAttachment = false,
  caseDetails,
  fullCaseDetails,
  onLoadFullDetails
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

  // Carregar detalhes completos quando modal abrir
  React.useEffect(() => {
    if (showDetailsModal && onLoadFullDetails && !fullCaseDetails) {
      onLoadFullDetails(id);
    }
  }, [showDetailsModal, id, onLoadFullDetails, fullCaseDetails]);

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
    approved: "Fechamento Aprovado",
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
          {/* CPF e Matrícula */}
          {caseDetails && (
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              {caseDetails.cpf && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">CPF:</span>
                  <span>{caseDetails.cpf}</span>
                </div>
              )}
              {caseDetails.matricula && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Mat:</span>
                  <span>{caseDetails.matricula}</span>
                </div>
              )}
            </div>
          )}
          {simulationResult?.banco && (
            <div className="bg-primary/10 px-2 py-1 rounded-md mt-2">
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

      {/* Valores Destacados - Liberado Cliente e Consultoria Líquida */}
      {simulationResult && (simulationResult.liberadoCliente || simulationResult.custoConsultoriaLiquido) && (
        <div className="grid grid-cols-2 gap-3">
          {simulationResult.liberadoCliente && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3">
              <div className="text-xs text-success font-medium mb-1">Liberado para Cliente</div>
              <div className="text-xl font-bold text-success">{formatCurrency(simulationResult.liberadoCliente)}</div>
            </div>
          )}
          {simulationResult.custoConsultoriaLiquido && (
            <div className="rounded-lg border border-info/40 bg-info/10 p-3">
              <div className="text-xs text-info font-medium mb-1">Consultoria Líquida (86%)</div>
              <div className="text-xl font-bold text-info">{formatCurrency(simulationResult.custoConsultoriaLiquido)}</div>
            </div>
          )}
        </div>
      )}


      {/* Informações Bancárias do Cliente */}


      {/* Seção de Anexos */}
      {(status === "approved" || status === "disbursed") && (
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

        {status === "approved" && (
          <div className="w-full space-y-2">
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
              {onReturnToCalc && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReturnToCalc(id)}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retornar ao Calculista
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
            {onDisburse && (
              <Button
                size="sm"
                onClick={() => onDisburse(id)}
                className="w-full"
              >
                Efetivar Liberação
              </Button>
            )}
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

          {fullCaseDetails ? (
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="client">Cliente</TabsTrigger>
                <TabsTrigger value="simulation">Simulação</TabsTrigger>
                <TabsTrigger value="contract">Contrato</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>

              {/* Aba Cliente */}
              <TabsContent value="client" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <p className="font-medium">{fullCaseDetails.client.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">CPF</span>
                    <p className="font-medium">{fullCaseDetails.client.cpf}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Matrícula</span>
                    <p className="font-medium">{fullCaseDetails.client.matricula}</p>
                  </div>
                  {fullCaseDetails.client.orgao && (
                    <div>
                      <span className="text-sm text-muted-foreground">Órgão</span>
                      <p className="font-medium">{fullCaseDetails.client.orgao}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.telefone_preferencial && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone</span>
                      <p className="font-medium">{fullCaseDetails.client.telefone_preferencial}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.banco && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">Banco</span>
                        <p className="font-medium">{fullCaseDetails.client.banco}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Agência</span>
                        <p className="font-medium">{fullCaseDetails.client.agencia}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Conta</span>
                        <p className="font-medium">{fullCaseDetails.client.conta}</p>
                      </div>
                    </>
                  )}
                  {fullCaseDetails.client.chave_pix && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Chave PIX ({fullCaseDetails.client.tipo_chave_pix})</span>
                      <p className="font-medium">{fullCaseDetails.client.chave_pix}</p>
                    </div>
                  )}
                  {fullCaseDetails.client.observacoes && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Observações</span>
                      <p className="font-medium">{fullCaseDetails.client.observacoes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Aba Simulação */}
              <TabsContent value="simulation" className="space-y-4">
                {fullCaseDetails.simulation ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-lg border border-success/40 bg-success-subtle p-3">
                        <span className="text-xs font-medium text-success">Valor Liberado</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.liberadoTotal)}</p>
                      </div>
                      <div className="rounded-lg border border-info/40 bg-info-subtle p-3">
                        <span className="text-xs font-medium text-info">Liberado Cliente</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.liberadoCliente)}</p>
                      </div>
                      <div className="rounded-lg border border-accent/40 bg-accent-subtle p-3">
                        <span className="text-xs font-medium text-accent">Valor Parcela</span>
                        <p className="font-bold">{formatCurrency(fullCaseDetails.simulation.totals.valorParcelaTotal)}</p>
                      </div>
                      <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3">
                        <span className="text-xs font-medium text-warning">Prazo</span>
                        <p className="font-bold">{fullCaseDetails.simulation.prazo} meses</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Total Financiado</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.totalFinanciado)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Custo Consultoria</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.custoConsultoria)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Consultoria Líquida (86%)</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.totals.custoConsultoriaLiquido)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Seguro Obrigatório</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.simulation.seguro)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Coeficiente</span>
                        <p className="font-medium font-mono">{fullCaseDetails.simulation.coeficiente}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">% Consultoria</span>
                        <p className="font-medium">{fullCaseDetails.simulation.percentual_consultoria}%</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma simulação encontrada</p>
                )}
              </TabsContent>

              {/* Aba Contrato */}
              <TabsContent value="contract" className="space-y-4">
                {fullCaseDetails.contract ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Valor Total</span>
                        <p className="font-medium">{formatCurrency(fullCaseDetails.contract.total_amount)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Parcelas</span>
                        <p className="font-medium">{fullCaseDetails.contract.installments}x</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data Liberação</span>
                        <p className="font-medium">{new Date(fullCaseDetails.contract.disbursed_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="font-medium capitalize">{fullCaseDetails.contract.status}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <h4 className="font-semibold">Anexos do Contrato ({fullCaseDetails.contract.attachments.length})</h4>
                      {fullCaseDetails.contract.attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {getFileIcon(att.filename, att.mime)}
                            <div>
                              <p className="text-sm font-medium">{att.filename}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Contrato ainda não efetivado</p>
                )}
              </TabsContent>

              {/* Aba Histórico */}
              <TabsContent value="history" className="space-y-2">
                {fullCaseDetails.events.length > 0 ? (
                  fullCaseDetails.events.map((event) => (
                    <div key={event.id} className="p-3 rounded border border-border/40 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{event.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {event.payload && Object.keys(event.payload).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(event.payload, null, 2)}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum evento registrado</p>
                )}
              </TabsContent>

              {/* Aba Anexos */}
              <TabsContent value="attachments" className="space-y-2">
                {fullCaseDetails.attachments.length > 0 ? (
                  fullCaseDetails.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        {getFileIcon(att.path, att.mime)}
                        <div>
                          <p className="text-sm font-medium">{att.path.split('/').pop()}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(att.size)} • {new Date(att.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum anexo do caso</p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4 py-8">
              <div className="text-center text-muted-foreground">
                <p>Carregando detalhes...</p>
              </div>
            </div>
          )}
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
