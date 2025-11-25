"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { KPICard, DateRangeFilterWithCalendar, Card, CardHeader, CardTitle, CardContent } from "@lifecalling/ui";
import { mobileApi } from "@/services/mobileApi";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils/currency";
import { startOfMonthBrasilia, endOfMonthBrasilia, formatDateBrasilia } from "@/lib/timezone";

export default function LifeMobileDashboard() {
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return formatDateBrasilia(startOfMonthBrasilia(now));
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return formatDateBrasilia(endOfMonthBrasilia(now));
  });

  const statusTone: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
    rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
  };
  const statusIconTone: Record<string, string> = {
    approved: "bg-emerald-500/20 text-emerald-200",
    pending: "bg-amber-500/20 text-amber-200",
    rejected: "bg-rose-500/20 text-rose-200",
  };
  const statusLabel: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Reprovado",
  };

  const { data: simulations, isLoading } = useQuery({
    queryKey: ["adminSimulations"],
    queryFn: mobileApi.getAdminSimulations,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredSimulations =
    simulations?.filter((sim) => {
      if (!sim.created_at) return false;
      const date = parseISO(sim.created_at);
      const start = startDate ? new Date(`${startDate}T00:00:00`) : startOfMonth(new Date());
      const end = endDate ? new Date(`${endDate}T23:59:59`) : endOfMonth(new Date());
      return isWithinInterval(date, { start, end });
    }) || [];

  const totalSimulations = filteredSimulations.length;
  const approvedSimulations = filteredSimulations.filter((s) => s.status === "approved").length;
  const pendingSimulations = filteredSimulations.filter((s) => s.status === "pending").length;
  const rejectedSimulations = filteredSimulations.filter((s) => s.status === "rejected").length;
  const totalVolume = filteredSimulations.reduce(
    (acc, curr) => acc + (curr.amount ?? curr.requested_amount ?? 0),
    0
  );
  const approvalRate = totalSimulations > 0 ? ((approvedSimulations / totalSimulations) * 100).toFixed(1) : "0";
  const recentSimulations = filteredSimulations
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Life Mobile Dashboard</h1>
          <p className="text-slate-400">Visão geral das simulações e clientes mobile</p>
        </div>
        <DateRangeFilterWithCalendar
          startDate={startDate}
          endDate={endDate}
          label="Período:"
          onDateRangeChange={(start, end) => {
            if (start) setStartDate(start);
            if (end) setEndDate(end);
          }}
          onClear={() => {
            const now = new Date();
            setStartDate(formatDateBrasilia(startOfMonthBrasilia(now)));
            setEndDate(formatDateBrasilia(endOfMonthBrasilia(now)));
          }}
          className="md:w-auto w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Simulações"
          value={totalSimulations}
          subtitle="No período selecionado"
          icon={FileText}
          gradientVariant="blue"
          isLoading={isLoading}
        />
        <KPICard
          title="Volume Solicitado"
          value={formatCurrency(totalVolume)}
          subtitle="Soma dos valores"
          icon={Smartphone}
          gradientVariant="emerald"
          isLoading={isLoading}
        />
        <KPICard
          title="Pendentes"
          value={pendingSimulations}
          subtitle="Aguardando análise"
          icon={Clock}
          gradientVariant="orange"
          isLoading={isLoading}
        />
        <KPICard
          title="Taxa de Aprovação"
          value={`${approvalRate}%`}
          subtitle={`${approvedSimulations} aprovadas`}
          icon={CheckCircle}
          gradientVariant="purple"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-800/60 shadow-lg shadow-black/40 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-slate-100">Simulações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6 text-slate-400">Carregando...</div>
            ) : filteredSimulations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nenhuma simulação encontrada no período.</div>
            ) : (
              <div className="space-y-4">
                {recentSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="flex items-center justify-between p-4 bg-slate-900/80 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${statusIconTone[sim.status] || "bg-slate-800 text-slate-200"}`}
                      >
                        {sim.status === "approved" ? (
                          <CheckCircle size={20} />
                        ) : sim.status === "rejected" ? (
                          <XCircle size={20} />
                        ) : (
                          <Clock size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{sim.user_name || "Usuário Desconhecido"}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(sim.created_at).toLocaleDateString("pt-BR")} • {sim.type?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-100">{formatCurrency(sim.amount ?? sim.requested_amount ?? 0)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${statusTone[sim.status] || "bg-slate-800 text-slate-200 border border-slate-700"}`}
                      >
                        {statusLabel[sim.status] || sim.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800/60 shadow-lg shadow-black/40 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-slate-100">Resumo por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={20} />
                  <span>Aprovadas</span>
                </div>
                <span className="font-bold">{approvedSimulations}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-yellow-400" size={20} />
                  <span>Pendentes</span>
                </div>
                <span className="font-bold">{pendingSimulations}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-400" size={20} />
                  <span>Reprovadas</span>
                </div>
                <span className="font-bold">{rejectedSimulations}</span>
              </div>
              <div className="pt-4 border-t mt-4 border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total</span>
                  <span className="font-bold text-lg text-slate-100">{totalSimulations}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
