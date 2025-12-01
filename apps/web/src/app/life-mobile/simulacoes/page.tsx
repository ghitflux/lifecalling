"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, ChevronRight } from "lucide-react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Card,
    CardContent,
    Button,
    Input,
    Badge
} from "@lifecalling/ui";
import { mobileApi, AdminSimulation } from "@/services/mobileApi";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";

export default function LifeMobileSimulationsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("todas");
    const [searchTerm, setSearchTerm] = useState("");

    const { data: simulations, isLoading } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos de cache
        refetchOnWindowFocus: false,
    });

    const statusTone: Record<string, string> = {
        approved: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
        approved_by_client: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
        cliente_aprovada: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
        pending: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
        rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/40"
    };

    const statusLabel: Record<string, string> = {
        approved: "Aguardando aprovação do cliente",
        approved_by_client: "Aprovado pelo cliente",
        cliente_aprovada: "Aprovado pelo cliente",
        pending: "Pendente",
        rejected: "Reprovado"
    };

    const filterSimulations = (status: string) => {
        if (!simulations) return [];
        let filtered = [...simulations].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Filter by status (consider grouped statuses)
        if (status !== "todas") {
            filtered = filtered.filter(sim => {
                const st = (sim.status || "").toLowerCase();
                if (status === "pending") {
                    return st === "pending" || st === "simulation_requested" || st === "approved"; // aguardando cliente
                }
                if (status === "approved") {
                    return st === "approved_by_client" || st === "cliente_aprovada" || st === "simulacao_aprovada";
                }
                if (status === "rejected") {
                    return st === "rejected";
                }
                return true;
            });
        }

        // Filter by search term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(sim =>
                sim.user_name?.toLowerCase().includes(lowerTerm) ||
                sim.user_email?.toLowerCase().includes(lowerTerm) ||
                sim.type?.toLowerCase().includes(lowerTerm)
            );
        }

        return filtered;
    };

    const renderSimulationCard = (sim: AdminSimulation) => (
        <Card
            key={sim.id}
            className="cursor-pointer transition-shadow border bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:shadow-lg hover:shadow-black/40"
            style={{
                borderLeftColor:
                    (sim.status === "approved_by_client" || sim.status === "cliente_aprovada" || sim.status === "simulacao_aprovada") ? "#22c55e" :
                        sim.status === "rejected" ? "#ef4444" :
                            "#f59e0b",
                borderLeftWidth: 4
            }}
            onClick={() => router.push(`/life-mobile/simulacoes/${sim.id}`)}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-semibold text-slate-100">{sim.user_name || "Usuário Desconhecido"}</h3>
                        <p className="text-sm text-slate-400">{sim.user_email}</p>
                    </div>
                    <Badge
                        variant="outline"
                        className={statusTone[sim.status] || "bg-slate-800 text-slate-200 border border-slate-700"}
                    >
                        {statusLabel[sim.status] || sim.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3 text-slate-300">
                    <div>
                        <p className="text-slate-400">Valor</p>
                        <p className="font-medium text-slate-100">{formatCurrency(sim.amount || sim.requested_amount || 0)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Tipo</p>
                        <p className="font-medium capitalize text-slate-100">{sim.type}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Parcelas</p>
                        <p className="font-medium text-slate-100">{sim.installments}x</p>
                    </div>
                    <div>
                        <p className="text-slate-400">Data</p>
                        <p className="font-medium text-slate-100">{new Date(sim.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                </div>

                <div className="flex justify-end items-center text-indigo-300 text-sm font-medium">
                    Ver detalhes <ChevronRight size={16} />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Simulações</h1>
                    <p className="text-slate-400">Gerencie as simulações de crédito</p>
                </div>
                <Button onClick={() => router.push('/life-mobile/simulacoes/nova')}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Simulação
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/70 p-4 rounded-lg border border-slate-800 shadow-lg shadow-black/30">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por cliente, email ou tipo..."
                        className="pl-9 border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="border-slate-700 text-slate-100 hover:bg-slate-800">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-900/70 border border-slate-800">
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                    <TabsTrigger value="rejected">Reprovadas</TabsTrigger>
                </TabsList>

                <TabsContent value="todas">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                        ) : filterSimulations("todas").length === 0 ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Nenhuma simulação encontrada.</p>
                        ) : (
                            filterSimulations("todas").map(renderSimulationCard)
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pending">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                        ) : filterSimulations("pending").length === 0 ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Nenhuma simulação pendente.</p>
                        ) : (
                            filterSimulations("pending").map(renderSimulationCard)
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="approved">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                        ) : filterSimulations("approved").length === 0 ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Nenhuma simulação aprovada.</p>
                        ) : (
                            filterSimulations("approved").map(renderSimulationCard)
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="rejected">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                        ) : filterSimulations("rejected").length === 0 ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Nenhuma simulação reprovada.</p>
                        ) : (
                            filterSimulations("rejected").map(renderSimulationCard)
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
