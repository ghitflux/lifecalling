"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import { SimulationCard, SimulationForm, Card, CalculistaSkeleton } from "@lifecalling/ui";
import { simuladorSantander, priceCoef } from "@/lib/calc";
import { useSims, useSimApprove, useSimReject } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api";
import { toast } from "sonner";

export default function CalculistaPage(){
  useLiveCaseEvents();
  const { data: sims, isLoading: simsLoading } = useSims("pending");
  const [active, setActive] = useState<number | null>(null);
  const approve = useSimApprove();
  const reject = useSimReject();
  const [loading, setLoading] = useState(false);

  // Query para buscar detalhes do caso ativo
  const { data: caseDetail, isLoading: caseLoading } = useQuery({
    queryKey: ["case", active],
    queryFn: async () => {
      if (!active) return null;
      // Buscar o caso relacionado à simulação
      const sim = sims?.find(s => s.id === active);
      if (!sim) return null;

      const response = await API.get(`/cases/${sim.case_id}`);
      return response.data;
    },
    enabled: !!active && !!sims
  });

  // Dados do formulário atual
  const [formData, setFormData] = useState({
    banco: "SANTANDER",
    parcelas: "96",
    saldo: "30000",
    parcela: "1000",
    seguro: "1000",
    percentOperacao: "2.5",
    percentConsultoria: "12",
    coeficiente: ""
  });

  // Calcular resultados baseado no formData
  const r = simuladorSantander({
    banco: formData.banco,
    parcelas: parseInt(formData.parcelas),
    saldoDevedor: parseInt(formData.saldo),
    parcela: parseInt(formData.parcela),
    seguroObrigatorio: parseInt(formData.seguro),
    percentualOperacaoMes: parseFloat(formData.percentOperacao),
    percentualConsultoria: parseFloat(formData.percentConsultoria)/100,
    coeficienteManual: formData.coeficiente ? Number(formData.coeficiente) : null,
  });

  const handleApprove = async (data: any) => {
    if (!active) return;
    setLoading(true);
    try {
      await approve.mutateAsync({
        simId: active,
        payload: {
          manual_input: data,
          results: r
        }
      });
      toast.success("Simulação aprovada com sucesso!");
    } catch (error) {
      toast.error("Erro ao aprovar simulação");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (data: any) => {
    if (!active) return;
    setLoading(true);
    try {
      await reject.mutateAsync({
        simId: active,
        payload: {
          manual_input: data,
          results: r
        }
      });
      toast.success("Simulação reprovada");
    } catch (error) {
      toast.error("Erro ao reprovar simulação");
    } finally {
      setLoading(false);
    }
  };

  if (simsLoading) {
    return <CalculistaSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Calculista — Simulações Pendentes</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Fila de Simulações */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <h2 className="font-medium mb-4">Fila de Pendências</h2>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {sims?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    active === s.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium">SIM #{s.id}</div>
                  <div className="text-xs text-muted-foreground">Caso #{s.case_id}</div>
                </button>
              ))}
              {(!sims || sims.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma simulação pendente
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Detalhes do Caso */}
        <Card className="lg:col-span-1">
          <div className="p-4">
            <h2 className="font-medium mb-4">Dados do Caso</h2>
            {caseLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ) : caseDetail ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span>
                  <div className="text-muted-foreground">{caseDetail.client.name}</div>
                </div>
                <div>
                  <span className="font-medium">CPF:</span>
                  <div className="text-muted-foreground">{caseDetail.client.cpf}</div>
                </div>
                <div>
                  <span className="font-medium">Matrícula:</span>
                  <div className="text-muted-foreground">{caseDetail.client.matricula}</div>
                </div>
                <div>
                  <span className="font-medium">Órgão:</span>
                  <div className="text-muted-foreground">{caseDetail.client.orgao}</div>
                </div>
                {caseDetail.client.telefone_preferencial && (
                  <div>
                    <span className="font-medium">Telefone:</span>
                    <div className="text-muted-foreground">{caseDetail.client.telefone_preferencial}</div>
                  </div>
                )}
                {caseDetail.client.observacoes && (
                  <div className="border-t pt-3 mt-3">
                    <span className="font-medium">Observações:</span>
                    <div className="text-muted-foreground text-xs mt-1">{caseDetail.client.observacoes}</div>
                  </div>
                )}
              </div>
            ) : active ? (
              <div className="text-muted-foreground text-sm">
                Selecione uma simulação para ver os detalhes
              </div>
            ) : null}
          </div>
        </Card>

        {/* Formulário e Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário */}
          <SimulationForm
            initialData={formData}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={loading || !active}
            showActions={!!active}
          />

          {/* Resultados da Simulação */}
          {active && (
            <SimulationCard
              result={{
                valorLiberado: r.valorLiberado,
                valorParcela: r.valorParcelaTotal,
                taxaJuros: parseFloat(formData.percentOperacao),
                prazo: parseInt(formData.parcelas)
              }}
              isActive={true}
              onApprove={() => handleApprove(formData)}
              onReject={() => handleReject(formData)}
            />
          )}

          {/* Detalhes Expandidos */}
          {active && (
            <Card>
              <div className="p-6">
                <h3 className="font-medium mb-4">Detalhes Completos da Simulação</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Coeficiente (D4):</span>
                    <span className="font-mono">{r.coeficiente.toFixed(7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Liberado (E7):</span>
                    <span className="font-mono">R$ {r.valorLiberado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo Devedor Total (E18):</span>
                    <span className="font-mono">R$ {r.saldoDevedorTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Total Financiado (E22):</span>
                    <span className="font-mono">R$ {r.valorTotalFinanciado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Líquido (E25):</span>
                    <span className="font-mono">R$ {r.valorLiquido.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo Consultoria (E27):</span>
                    <span className="font-mono">R$ {r.custoConsultoria.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liberado Cliente (E29):</span>
                    <span className="font-mono">R$ {r.liberadoCliente.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>30% do Líquido (E51):</span>
                    <span className="font-mono">R$ {r.trintaPorCentoDoLiquido.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
