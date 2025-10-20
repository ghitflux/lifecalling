/* packages/ui/src/SimulationHistoryModal.tsx */
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardContent } from "./Card";
import { cn } from "./lib/utils";
import {
  History,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign,
  Clock,
  Edit,
  TrendingUp,
} from "lucide-react";

interface SimulationHistoryEntry {
  simulation_id: number;
  action: string;
  status: string;
  timestamp?: string;
  created_at?: string;
  approved_by?: number;
  approved_by_name?: string;
  rejected_by?: number;
  rejected_by_name?: string;
  created_by?: number;
  created_by_name?: string;
  reason?: string;
  observacao_calculista?: string;
  is_current?: boolean;
  version_number?: number;
  totals: {
    valorParcelaTotal: number;
    saldoTotal: number;
    liberadoTotal: number;
    seguroObrigatorio?: number;
    totalFinanciado: number;
    valorLiquido: number;
    custoConsultoria: number;
    custoConsultoriaLiquido?: number;
    liberadoCliente: number;
  };
  banks: Array<{
    banco?: string;
    bank?: string;
    parcela: number;
    saldoDevedor: number;
    valorLiberado: number;
  }>;
  prazo: number;
  coeficiente?: string;
  percentualConsultoria: number;
}

interface SimulationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SimulationHistoryEntry[];
  onEditSimulation?: (entry: SimulationHistoryEntry) => void;
  onSetAsFinal?: (simulationId: number) => void;
  caseId?: number;
  clientName?: string;
  showEditButton?: boolean;
  showSetAsFinalButton?: boolean;
  currentSimulationId?: number | null;
}

export function SimulationHistoryModal({
  isOpen,
  onClose,
  history = [],
  onEditSimulation,
  onSetAsFinal,
  caseId,
  clientName,
  showEditButton = true,
  showSetAsFinalButton = false,
  currentSimulationId = null,
}: SimulationHistoryModalProps) {
  const [selectedEntry, setSelectedEntry] = useState<SimulationHistoryEntry | null>(null);

  const getBankName = (bank: any): string => {
    const name = bank?.banco || bank?.bank || "Banco não identificado";
    return name.replace(/_/g, " ");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, isCurrent: boolean = false) => {
    if (status === "approved") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovada
        </Badge>
      );
    }
    if (status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitada
        </Badge>
      );
    }
    if (status === "draft") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Rascunho
        </Badge>
      );
    }
    if (status === "superseded") {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200">
          <History className="h-3 w-3 mr-1" />
          Antiga
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const handleEditClick = (entry: SimulationHistoryEntry) => {
    setSelectedEntry(entry);
    if (onEditSimulation) {
      onEditSimulation(entry);
    }
  };

  const handleSetAsFinal = (entry: SimulationHistoryEntry) => {
    if (onSetAsFinal && entry.status === "approved") {
      onSetAsFinal(entry.simulation_id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Simulações
          </DialogTitle>
          <DialogDescription>
            {clientName && `Cliente: ${clientName}`}
            {caseId && ` • Caso #${caseId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Nenhuma simulação no histórico
              </h3>
              <p className="text-sm text-muted-foreground">
                As simulações aprovadas/rejeitadas aparecerão aqui.
              </p>
            </div>
          ) : (
            history.map((entry, index) => {
              const isCurrent = entry.is_current || entry.simulation_id === currentSimulationId;

              return (
                <Card
                  key={`simulation-${entry.simulation_id}-${index}`}
                  className={cn(
                    "transition-all",
                    isCurrent && "ring-2 ring-green-500 border-green-300",
                    selectedEntry?.simulation_id === entry.simulation_id && !isCurrent &&
                      "ring-2 ring-primary"
                  )}
                >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          #{entry.simulation_id}
                        </Badge>
                        {getStatusBadge(entry.status, isCurrent)}
                        {isCurrent && (
                          <Badge className="bg-green-600 text-white border-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ATUAL
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {entry.version_number ? `Versão ${entry.version_number}` : index === 0 ? "Mais recente" : `Versão ${history.length - index}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showEditButton && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(entry)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        {showSetAsFinalButton && entry.status === "approved" && !isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetAsFinal(entry)}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selecionar como Final
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDate(entry.timestamp || entry.created_at || "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {entry.approved_by_name || entry.rejected_by_name || entry.created_by_name || "Sistema"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {entry.prazo} meses • {entry.percentualConsultoria}% consultoria
                        </span>
                      </div>
                    </div>

                    {/* Motivo de rejeição */}
                    {entry.status === "rejected" && entry.reason && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-700">
                          <strong>Motivo da rejeição:</strong> {entry.reason}
                        </p>
                      </div>
                    )}

                    {/* Totais */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Total Financiado</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(entry.totals.totalFinanciado)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Valor Líquido</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(entry.totals.valorLiquido)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Custo Consultoria</p>
                        <p className="text-sm font-semibold text-amber-600">
                          {formatCurrency(entry.totals.custoConsultoria)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Custo Líquido (86%)</p>
                        <p className="text-sm font-semibold text-purple-600">
                          {formatCurrency(entry.totals.custoConsultoriaLiquido || entry.totals.custoConsultoria * 0.86)}
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                        <p className="text-xs text-emerald-700 mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Liberado Cliente
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          {formatCurrency(entry.totals.liberadoCliente)}
                        </p>
                      </div>
                    </div>

                    {/* Bancos - Tags */}
                    {entry.banks && entry.banks.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-3">
                          Bancos incluídos:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.banks.map((bank, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs font-medium px-3 py-1"
                            >
                              {getBankName(bank)}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {entry.banks.map((bank, idx) => (
                            <div
                              key={idx}
                              className="bg-muted/30 rounded-md p-2 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{getBankName(bank)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(bank.valorLiberado)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                                <span>Parcela: {formatCurrency(bank.parcela)}</span>
                                <span>Saldo: {formatCurrency(bank.saldoDevedor)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observações do Calculista */}
                    {entry.observacao_calculista && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Observações do Calculista:
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm text-blue-800">
                            {entry.observacao_calculista}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
