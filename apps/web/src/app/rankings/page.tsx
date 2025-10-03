"use client";
import { useQuery } from "@tanstack/react-query";
import { api, BASE_URL } from "@/lib/api";
import { KpiCard, RankingTable, GradientPanel, ProgressBar } from "@lifecalling/ui"; // reuse
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RankingsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<{from?: string; to?: string}>({});

  const agents = useQuery({
    queryKey: ["rankings","agents",range],
    queryFn: async () => (await api.get("/rankings/agents", { params: range })).data.items
  });

  const targets = useQuery({
    queryKey: ["rankings","targets"],
    queryFn: async () => (await api.get("/rankings/agents/targets")).data.items
  });

  // calcular “meus números”
  const me = agents.data?.find((r:any)=> r.user_id === user?.id);
  const myTarget = useMemo(() => {
    return targets.data?.find((t: any) => t.user_id === user?.id);
  }, [targets.data, user?.id]);

  const tableData = useMemo(() => {
    const base = agents.data ?? [];
    return base.map((row: any, idx: number) => ({ ...row, pos: idx + 1 }));
  }, [agents.data]);

  function ProgressCell(row: any) {
    const t = targets.data?.find((x: any) => x.user_id === row.user_id);
    const metaContracts = t?.meta_contratos ?? 0;
    const achieved = metaContracts ? Math.min(100, Math.round(100 * (row.contracts ?? 0) / metaContracts)) : 0;
    const variant = achieved < 30 ? "danger" : achieved < 70 ? "warning" : "success";
    return (
      <div className="min-w-[160px]">
        <ProgressBar value={achieved} max={100} size="sm" variant={variant} />
      </div>
    );
  }

  const handleExportCsv = (kind: "agents" | "teams") => {
    const params = new URLSearchParams();
    params.set("kind", kind);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const url = `${BASE_URL}/rankings/export.csv?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* header (range + export) */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={range.from ?? ""} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={range.to ?? ""} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportCsv("agents")}>Exportar Atendentes (CSV)</Button>
          <Button variant="outline" onClick={() => handleExportCsv("teams")}>Exportar Times (CSV)</Button>
        </div>
      </div>
      {/* card “meus números” */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Meus contratos" value={me?.contracts ?? 0} gradientVariant="emerald"/>
        <KpiCard title="Minha consultoria líquida" value={me?.consultoria_liq ?? 0} currency gradientVariant="violet"/>
        <GradientPanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Atingimento de Meta</div>
            <ProgressBar
              value={myTarget?.meta_contratos ? Math.min(100, Math.round(100 * (me?.contracts ?? 0) / myTarget.meta_contratos)) : 0}
              max={100}
              size="md"
              variant={(myTarget?.meta_contratos ? Math.round(100 * (me?.contracts ?? 0) / myTarget.meta_contratos) : 0) < 30 ? "danger" : (myTarget?.meta_contratos ? Math.round(100 * (me?.contracts ?? 0) / myTarget.meta_contratos) : 0) < 70 ? "warning" : "success"}
              showLabel
              label="Contratos"
            />
          </div>
        </GradientPanel>
      </div>

      {/* ranking de atendentes */}
      <GradientPanel>
        <RankingTable
          data={tableData}
          columns={[
            { key: "pos", header: "#" },
            { key: "name", header: "Atendente" },
            { key: "contracts", header: "Contratos", format: "number" },
            { key: "consultoria_liq", header: "Consult. Líq.", format: "currency" },
            { key: "ticket_medio", header: "Ticket Médio", format: "currency" },
            { key: "atingimento", header: "Atingimento", render: ProgressCell },
            { key: "trend_consult", header: "Δ Consult.", format: "signedCurrency" },
          ]}
        />
      </GradientPanel>

      {/* ranking por times, se houver */}
    </div>
  );
}
