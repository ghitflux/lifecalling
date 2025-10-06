/* packages/ui/src/SimulationWorkspace.tsx */
"use client";
import React, { useState } from "react";
import { SimulationForm } from "./SimulationForm";
import { SimulationCard } from "./SimulationCard";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { type SimulationResult } from "./lib/simulationUtils";
import { CheckCircle, XCircle, Calculator, RefreshCw } from "lucide-react";

export interface SimulationWorkspaceProps {
  caseId?: number;
  initialFormData?: any;
  onApprove?: (result: SimulationResult) => void;
  onReject?: (reason?: string) => void;
  onSave?: (result: SimulationResult) => void;
  loading?: boolean;
  className?: string;
  showActions?: boolean;
  autoCalculate?: boolean;
}

export function SimulationWorkspace({
  caseId,
  initialFormData,
  onApprove,
  onReject,
  onSave,
  loading = false,
  className,
  showActions = true,
  autoCalculate = false
}: SimulationWorkspaceProps) {
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastSavedResult, setLastSavedResult] = useState<SimulationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<'approve' | 'reject' | null>(null);

  const handleCalculation = (result: SimulationResult) => {
    setCurrentResult(result);
    setIsCalculating(false);
  };

  const handleApprove = () => {
    if (currentResult) {
      if (showConfirmation === 'approve') {
        onApprove?.(currentResult);
        setLastSavedResult(currentResult);
        setShowConfirmation(null);
      } else {
        setShowConfirmation('approve');
      }
    }
  };

  const handleReject = () => {
    if (showConfirmation === 'reject') {
      onReject?.();
      setShowConfirmation(null);
    } else {
      setShowConfirmation('reject');
    }
  };

  const handleSave = () => {
    if (currentResult) {
      onSave?.(currentResult);
      setLastSavedResult(currentResult);
    }
  };

  const hasChanges = currentResult && (!lastSavedResult ||
    JSON.stringify(currentResult) !== JSON.stringify(lastSavedResult));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {caseId && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Simulação - Caso #{caseId}</h2>
            <p className="text-sm text-muted-foreground">
              Configure os parâmetros e calcule a simulação
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentResult && (
              <Badge variant="outline" className="text-green-600">
                <Calculator className="h-3 w-3 mr-1" />
                Simulação Calculada
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600">
                <RefreshCw className="h-3 w-3 mr-1" />
                Alterações não salvas
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div>
          <SimulationForm
            initialData={initialFormData}
            onCalculate={handleCalculation}
            loading={isCalculating}
            showCalculateButton={true}
            autoCalculate={autoCalculate}
          />
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {currentResult ? (
            <>
              <SimulationCard
                result={currentResult}
                isActive={true}
                className="w-full"
              />

              {/* Actions */}
              {showActions && (
                <div className="space-y-3">
                  {/* Save Button */}
                  {onSave && (
                    <Button
                      onClick={handleSave}
                      variant="outline"
                      className="w-full"
                      disabled={!hasChanges}
                    >
                      Salvar Simulação
                    </Button>
                  )}

                  {/* Approval Actions */}
                  {(onApprove || onReject) && (
                    <div className="grid grid-cols-2 gap-3">
                      {onReject && (
                        <Button
                          onClick={handleReject}
                          variant={showConfirmation === 'reject' ? "destructive" : "outline"}
                          disabled={loading}
                        >
                          {showConfirmation === 'reject' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Confirmar Rejeição
                            </>
                          ) : (
                            'Rejeitar'
                          )}
                        </Button>
                      )}

                      {onApprove && (
                        <Button
                          onClick={handleApprove}
                          variant={showConfirmation === 'approve' ? "default" : "outline"}
                          disabled={loading}
                          className={showConfirmation === 'approve' ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                              Aprovando...
                            </>
                          ) : showConfirmation === 'approve' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmar Aprovação
                            </>
                          ) : (
                            'Aprovar Simulação'
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Confirmation Text */}
                  {showConfirmation && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {showConfirmation === 'approve'
                          ? 'Clique novamente para confirmar a aprovação da simulação'
                          : 'Clique novamente para confirmar a rejeição'
                        }
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmation(null)}
                        className="text-xs mt-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Aguardando Cálculo
              </h3>
              <p className="text-xs text-muted-foreground">
                Preencha os dados no formulário e clique em "Calcular Simulação Completa"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      {currentResult && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {lastSavedResult ? 'Simulação Salva' : 'Simulação Calculada'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Valor para Cliente:</span>
              <span className="font-bold text-green-600">
                R$ {currentResult.liberadoCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}