"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Financiamento {
  id: number;
  matricula: string;
  financiamento_code: string;
  total_parcelas: number;
  parcelas_pagas: number;
  valor_parcela_ref: string;
  orgao_pagamento: string;
  orgao_pagamento_nome?: string;
  entity_name: string;
  status_code: string;
  status_description: string;
}

interface SimulationTotals {
  valorParcelaTotal: number;
  saldoTotal: number;
  liberadoTotal: number;
  seguroObrigatorio?: number;
  totalFinanciado: number;
  valorLiquido: number;
  custoConsultoria: number;
  custoConsultoriaLiquido?: number;
  liberadoCliente: number;
}

interface FinancialInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  financiamentos: Financiamento[];
  clientMatricula: string;
  clientName: string;
  simulationTotals?: SimulationTotals;
}

export function FinancialInfoModal({
  isOpen,
  onClose,
  financiamentos,
  clientMatricula,
  clientName,
  simulationTotals
}: FinancialInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Informações Financeiras ({financiamentos.length})</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {clientName}
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {financiamentos.map((fin, index) => (
            <div
              key={fin.id}
              className="rounded-lg border border-border/40 bg-muted/40 p-4 text-sm space-y-3"
            >
              {/* Matrícula do Financiamento */}
              {fin.matricula && fin.matricula !== clientMatricula && (
                <div className="pb-2 border-b border-warning/30 bg-warning/5 -m-4 mb-0 p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <div className="text-xs font-medium text-warning">
                      Matrícula diferente: {fin.matricula}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Status do Financiamento</div>
                  <div className="font-medium">{fin.status_description}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{fin.total_parcelas} parcelas</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pago</div>
                  <div className="font-medium">{fin.parcelas_pagas} parcelas</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseFloat(fin.valor_parcela_ref))}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Órgão Pagamento</div>
                  <div className="font-medium">
                    {fin.orgao_pagamento_nome || fin.orgao_pagamento} - {fin.entity_name}
                  </div>
                </div>
                {/* Data de Referência removida - propriedade não existe em PayrollLine */}
                {/* <div>
                  <div className="text-xs text-muted-foreground">Data de Referência</div>
                  <div className="font-medium">
                    {fin.referencia || '-'}
                  </div>
                </div> */}
              </div>
            </div>
          ))}
        </div>

        {/* Informações da Simulação */}
        {simulationTotals && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-3 text-sm">Resumo da Simulação</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border border-success/40 bg-success/5 p-3">
                <div className="text-xs text-muted-foreground">Valor Liberado Total</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(simulationTotals.liberadoTotal)}
                </div>
              </div>
              {simulationTotals.seguroObrigatorio && (
                <div className="rounded border border-info/40 bg-info/5 p-3">
                  <div className="text-xs text-muted-foreground">Seguro Obrigatório</div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(simulationTotals.seguroObrigatorio)}
                  </div>
                </div>
              )}
              <div className="rounded border border-warning/40 bg-warning/5 p-3">
                <div className="text-xs text-muted-foreground">Custo Consultoria</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(simulationTotals.custoConsultoria)}
                </div>
              </div>
              <div className="rounded border border-accent/40 bg-accent/5 p-3">
                <div className="text-xs text-muted-foreground">Consultoria Líquida</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(simulationTotals.custoConsultoriaLiquido || (simulationTotals.custoConsultoria * 0.86))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
