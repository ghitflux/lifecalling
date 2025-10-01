"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Card, CaseDetails, SimulationResultCard, SimulationHistoryModal } from "@lifecalling/ui";
import { ArrowLeft, History } from "lucide-react";

export default function FechamentoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = parseInt(params.id as string);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Buscar detalhes do caso
  const { data: caseData, isLoading } = useQuery({
    queryKey: ["cases", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    },
  });

  // Buscar histórico de simulações
  const { data: simulationHistory } = useQuery({
    queryKey: ["simulationHistory", caseId],
    queryFn: async () => {
      const response = await api.get(`/simulations/${caseId}/history`);
      return response.data?.items || [];
    },
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Caso não encontrado</p>
          <Button onClick={() => router.back()}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">Detalhes do Fechamento</h1>
      </div>

      {/* Detalhes do Caso */}
      <CaseDetails
        case={caseData}
        showActions={false}
      />

      {/* Simulação Aprovada */}
      {caseData.simulation && caseData.simulation.status === "approved" && (
        <SimulationResultCard
          totals={{
            valorParcelaTotal: caseData.simulation.totals?.valorParcelaTotal || 0,
            saldoTotal: caseData.simulation.totals?.saldoTotal || 0,
            liberadoTotal: caseData.simulation.totals?.liberadoTotal || 0,
            totalFinanciado: caseData.simulation.totals?.totalFinanciado || 0,
            valorLiquido: caseData.simulation.totals?.valorLiquido || 0,
            custoConsultoria: caseData.simulation.totals?.custoConsultoria || 0,
            liberadoCliente: caseData.simulation.totals?.liberadoCliente || 0
          }}
          simulation={{
            banks: caseData.simulation.banks || [],
            prazo: caseData.simulation.prazo || 0,
            coeficiente: "",
            seguro: 0,
            percentualConsultoria: caseData.simulation.percentualConsultoria || 0
          }}
        />
      )}

      {/* Botão Histórico de Simulações */}
      {simulationHistory && simulationHistory.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowHistoryModal(true)}
          className="w-full"
        >
          <History className="h-4 w-4 mr-2" />
          Ver Histórico de Simulações ({simulationHistory.length})
        </Button>
      )}

      {/* Modal de Histórico */}
      <SimulationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={simulationHistory || []}
        caseId={caseId}
        clientName={caseData?.client?.name}
        onEditSimulation={() => {
          // Fechamento não permite edição
        }}
      />
    </div>
  );
}