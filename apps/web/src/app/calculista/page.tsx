"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useState } from "react";
import { SimulationCard, SimulationForm, Card, CalculistaSkeleton } from "@lifecalling/ui";
import { SimuladorCalculista, priceCoef } from "@/lib/calc";
import { useSims, useSimApprove, useSimReject } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
      const sim = sims?.find((s: any) => s.id === active);
      if (!sim) return null;

      const response = await api.get(`/cases/${sim.case_id}`);
      return response.data;
    },
    enabled: !!active && !!sims
  });

  // Dados do formulário atual
  const [formData, setFormData] = useState({
    banco: "SANTANDER",
    parcelas: "96",
    saldo: "30000",
    seguro: "1000",
    percentOperacao: "2.5",
    percentConsultoria: "12",
    coeficiente: ""
  });

  // Calcular resultados baseado no formData
  // Usando valor padrão de parcela de R$ 1.000,00 conforme imagem
  const r = SimuladorCalculista({
    banco: formData.banco,
    parcelas: parseInt(formData.parcelas),
    saldoDevedor: parseInt(formData.saldo),
    parcela: 1000, // Valor fixo conforme layout da imagem
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
              {sims?.map((s: any) => (
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
            onChange={setFormData}
            loading={loading || !active}
          />

          {/* Resultados da Simulação */}
          {active && (
            <SimulationCard
              result={{
                banco: formData.banco,
                valorLiberado: r.valorLiberado,
                valorParcela: r.valorParcelaTotal,
                coeficiente: r.coeficiente,
                saldoDevedor: parseInt(formData.saldo),
                valorTotalFinanciado: r.valorTotalFinanciado,
                seguroObrigatorio: parseInt(formData.seguro),
                valorLiquido: r.valorLiquido,
                custoConsultoria: r.custoConsultoria,
                liberadoCliente: r.liberadoCliente,
                percentualConsultoria: parseFloat(formData.percentConsultoria) / 100,
                taxaJuros: parseFloat(formData.percentOperacao),
                prazo: parseInt(formData.parcelas)
              }}
              isActive={true}
              onApprove={() => handleApprove(formData)}
              onReject={() => handleReject(formData)}
            />
          )}

        </div>
      </div>
    </div>
  );
}
