"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Smartphone,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import {
    KPICard,
    DateRangeFilter,
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@lifecalling/ui";
import { mobileApi, AdminSimulation } from "@/services/mobileApi";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export default function LifeMobileDashboard() {
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const { data: simulations, isLoading } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos de cache
        refetchOnWindowFocus: false,
    });

    // Filter simulations by date
    const filteredSimulations = simulations?.filter((sim) => {
        if (!sim.created_at) return false;
        const date = parseISO(sim.created_at);
        return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    }) || [];

    // Calculate Metrics
    const totalSimulations = filteredSimulations.length;
    const approvedSimulations = filteredSimulations.filter(s => s.status === "approved").length;
    const pendingSimulations = filteredSimulations.filter(s => s.status === "pending").length;
    const rejectedSimulations = filteredSimulations.filter(s => s.status === "rejected").length;

    // Calculate Total Volume (assuming amount is available, otherwise 0)
    const totalVolume = filteredSimulations.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Life Mobile Dashboard</h1>
                    <p className="text-gray-500">Visão geral das simulações e clientes mobile</p>
                </div>
                <DateRangeFilter
                    date={dateRange}
                    onDateChange={(range) => {
                        if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to });
                        }
                    }}
                />
            </div>

            {/* KPI Cards */}
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
                    value={`R$ ${totalVolume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
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
                    value={`${totalSimulations > 0 ? ((approvedSimulations / totalSimulations) * 100).toFixed(1) : 0}%`}
                    subtitle={`${approvedSimulations} aprovadas`}
                    icon={CheckCircle}
                    gradientVariant="purple"
                    isLoading={isLoading}
                />
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Simulações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-4">Carregando...</div>
                        ) : filteredSimulations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma simulação encontrada no período.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredSimulations.slice(0, 5).map((sim) => (
                                    <div key={sim.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${sim.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                sim.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                    'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {sim.status === 'approved' ? <CheckCircle size={20} /> :
                                                    sim.status === 'rejected' ? <XCircle size={20} /> :
                                                        <Clock size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{sim.user_name || 'Usuário Desconhecido'}</p>
                                                <p className="text-sm text-gray-500">{new Date(sim.created_at).toLocaleDateString('pt-BR')} • {sim.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                R$ {sim.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${sim.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                sim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {sim.status === 'pending' ? 'Pendente' : sim.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumo por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>Aprovadas</span>
                                </div>
                                <span className="font-bold">{approvedSimulations}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="text-yellow-500" size={20} />
                                    <span>Pendentes</span>
                                </div>
                                <span className="font-bold">{pendingSimulations}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <XCircle className="text-red-500" size={20} />
                                    <span>Reprovadas</span>
                                </div>
                                <span className="font-bold">{rejectedSimulations}</span>
                            </div>
                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Total</span>
                                    <span className="font-bold text-lg">{totalSimulations}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
