/* packages/ui/src/CaseDetails.tsx */
import React from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { StatusBadge, type Status } from "./StatusBadge";
import { cn } from "./lib/utils";
import {
  User,
  Calendar,
  CreditCard,
  Building2,
  Hash,
  DollarSign,
  Phone,
  FileText,
  Paperclip,
  Eye,
  Download,
  MessageSquare,
  Clock,
  CheckCircle
} from "lucide-react";

interface Client {
  name?: string;
  cpf?: string;
  matricula?: string;
  orgao?: string;
  telefone?: string;
}

interface SimulationBank {
  bank: string;
  parcela: number;
  saldoDevedor: number;
  valorLiberado: number;
}

interface SimulationTotals {
  valorParcelaTotal: number;
  saldoTotal: number;
  liberadoTotal: number;
  totalFinanciado: number;
  valorLiquido: number;
  custoConsultoria: number;
  liberadoCliente: number;
}

interface SimulationResult {
  // Estrutura antiga (para compatibilidade)
  banco?: string;
  valorLiberado?: number;
  valorParcela?: number;
  coeficiente?: number;
  saldoDevedor?: number;
  valorTotalFinanciado?: number;
  seguroObrigatorio?: number;
  valorLiquido?: number;
  custoConsultoria?: number;
  liberadoCliente?: number;
  percentualConsultoria?: number;
  taxaJuros?: number;
  prazo?: number;

  // Nova estrutura multi-bancos
  banks?: SimulationBank[];
  totals?: SimulationTotals;
}

interface Simulation {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  results?: SimulationResult;
  manual_input?: any;
  created_at: string;
  updated_at?: string;
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
  type: string;
  url?: string;
}

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  module: string;
}

interface CaseDetailsProps {
  case: {
    id: number;
    status: Status;
    client?: Client;
    simulation?: Simulation;
    contract?: {
      total_amount?: number;
      installments?: number;
    };
    banco?: string;
    created_at?: string;
    last_update_at?: string;
    assigned_to?: string;
    telefone_preferencial?: string;
    observacoes?: string;
  };
  attachments?: Attachment[];
  notes?: Note[];
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onAddNote?: (note: string) => void;
  onDownloadAttachment?: (attachmentId: string) => void;
  className?: string;
  showActions?: boolean;
  hideFinancialInfo?: boolean;
  hideNotesCard?: boolean;
}

export function CaseDetails({
  case: caseData,
  attachments = [],
  notes = [],
  onApprove,
  onReject,
  onAddNote,
  onDownloadAttachment,
  className,
  showActions = true,
  hideFinancialInfo = false,
  hideNotesCard = false
}: CaseDetailsProps) {
  const [newNote, setNewNote] = React.useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Caso #{caseData.id}</h1>
              <StatusBadge status={caseData.status} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {formatDate(caseData.created_at)}
            </p>
            {caseData.last_update_at && (
              <p className="text-xs text-muted-foreground">
                Última atualização: {formatDate(caseData.last_update_at)}
              </p>
            )}
          </div>

          {showActions && (onApprove || onReject) && (
            <div className="flex gap-2">
              {onApprove && (
                <Button onClick={() => onApprove(caseData.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              )}
              {onReject && (
                <Button variant="destructive" onClick={() => onReject(caseData.id)}>
                  Rejeitar
                </Button>
              )}
            </div>
          )}
        </div>

        {caseData.assigned_to && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Atribuído a: <strong>{caseData.assigned_to}</strong></span>
          </div>
        )}
      </Card>

      {/* Client Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações do Cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="font-medium">{caseData.client?.name || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CPF</label>
              <p className="font-mono">{caseData.client?.cpf || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
              <p className="font-mono">{caseData.client?.matricula || 'Não informado'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Órgão</label>
              <p>{caseData.client?.orgao || 'Não informado'}</p>
            </div>
            {(caseData.client?.telefone || caseData.telefone_preferencial) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-info" />
                <p className="font-medium text-info">
                  {caseData.client?.telefone || caseData.telefone_preferencial}
                  </p>
                </div>
              </div>
            )}
            {caseData.banco && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Banco</label>
                <Badge variant="outline">{caseData.banco}</Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Financial Information */}
      {!hideFinancialInfo && caseData.simulation && caseData.simulation.status === 'approved' && caseData.simulation.results && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Informações Financeiras
          </h2>

          <div className="mb-4 rounded-lg border border-success/40 bg-success-subtle p-3 text-sm text-success-foreground">
            ✅ Simulação aprovada em {formatDate(caseData.simulation.updated_at)}
          </div>

          {/* Verifica se é nova estrutura multi-bancos ou antiga */}
          {caseData.simulation.results.totals ? (
            // Nova estrutura multi-bancos
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">TOTAL LIBERADO</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(caseData.simulation.results.totals.liberadoTotal || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">TOTAL PARCELAS</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(caseData.simulation.results.totals.valorParcelaTotal || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">LIBERADO CLIENTE</p>
                  <p className="text-xl font-bold text-info">
                    {formatCurrency(caseData.simulation.results.totals.liberadoCliente || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">VALOR LÍQUIDO</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(caseData.simulation.results.totals.valorLiquido || 0)}
                  </p>
                </div>
              </div>

              {/* Detalhes dos Bancos */}
              {caseData.simulation.results.banks && caseData.simulation.results.banks.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-3">Detalhes por Banco</h4>
                  <div className="space-y-2">
                    {caseData.simulation.results.banks.map((bank, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3">
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Banco:</span>
                            <p className="font-medium">{bank.bank.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Parcela:</span>
                            <p className="font-medium">{formatCurrency(bank.parcela)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Saldo Dev:</span>
                            <p className="font-medium">{formatCurrency(bank.saldoDevedor)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Liberado:</span>
                            <p className="font-medium text-success">{formatCurrency(bank.valorLiberado)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totais Adicionais */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Financiado: </span>
                    <span className="font-medium">{formatCurrency(caseData.simulation.results.totals.totalFinanciado)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo Consultoria: </span>
                    <span className="font-medium">{formatCurrency(caseData.simulation.results.totals.custoConsultoria)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saldo Total: </span>
                    <span className="font-medium">{formatCurrency(caseData.simulation.results.totals.saldoTotal)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Estrutura antiga (para compatibilidade)
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">VALOR LIBERADO</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(caseData.simulation.results.valorLiberado || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">VALOR PARCELA</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(caseData.simulation.results.valorParcela || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">VALOR LÍQUIDO</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(caseData.simulation.results.valorLiquido || 0)}
                  </p>
                </div>
              </div>

              {/* Detalhes Adicionais */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {caseData.simulation.results.valorTotalFinanciado && (
                    <div>
                      <span className="text-muted-foreground">Total Financiado: </span>
                      <span className="font-medium">{formatCurrency(caseData.simulation.results.valorTotalFinanciado)}</span>
                    </div>
                  )}
                  {caseData.simulation.results.custoConsultoria && (
                    <div>
                      <span className="text-muted-foreground">Custo Consultoria: </span>
                      <span className="font-medium">{formatCurrency(caseData.simulation.results.custoConsultoria)}</span>
                    </div>
                  )}
                  {caseData.simulation.results.coeficiente && (
                    <div>
                      <span className="text-muted-foreground">Coeficiente: </span>
                      <span className="font-mono font-medium">{caseData.simulation.results.coeficiente.toFixed(7)}</span>
                    </div>
                  )}
                  {caseData.simulation.results.saldoDevedor && (
                    <div>
                      <span className="text-muted-foreground">Saldo Devedor: </span>
                      <span className="font-medium">{formatCurrency(caseData.simulation.results.saldoDevedor)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Simulation Status (pending/rejected) */}
      {caseData.simulation && caseData.simulation.status !== 'approved' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Status da Simulação
          </h2>

          {caseData.simulation.status === 'pending' && (
            <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3 text-sm text-warning-foreground">
              ⏳ Simulação pendente de análise pelo calculista
            </div>
          )}

          {caseData.simulation.status === 'rejected' && (
            <div className="rounded-lg border border-danger/40 bg-danger-subtle p-3 text-sm text-danger-foreground">
              ❌ Simulação reprovada em {formatDate(caseData.simulation.updated_at)}
            </div>
          )}
        </Card>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexos ({attachments.length})
          </h2>

          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{attachment.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {formatDate(attachment.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownloadAttachment?.(attachment.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes and Observations */}
      {!hideNotesCard && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Anotações e Observações
          </h2>

          {/* Existing Notes */}
          {notes.length > 0 && (
            <div className="space-y-3 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{note.author}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {note.module}
                      </Badge>
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Case Observations */}
          {caseData.observacoes && (
            <div className="bg-muted/30 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium mb-1">Observações do Caso:</p>
              <p className="text-sm">{caseData.observacoes}</p>
            </div>
          )}

          {/* Add New Note */}
          {onAddNote && (
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar nova anotação..."
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Adicionar Anotação
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
