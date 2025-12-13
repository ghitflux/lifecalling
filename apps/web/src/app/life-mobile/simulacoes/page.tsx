"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
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
import { useSimulationsForAnalysis } from "@/hooks/useMobileAnalysis";
import { AnalysisModal } from "@/components/mobile/AnalysisModal";

export default function LifeMobileSimulationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("analise");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSimulation, setSelectedSimulation] = useState<AdminSimulation | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: simulations, isLoading } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos de cache
        refetchOnWindowFocus: false,
    });

    const { data: analysisSimulations, isLoading: isLoadingAnalysis } = useSimulationsForAnalysis();

    const defaultBadgeTone = "bg-slate-800 text-slate-200 border border-slate-700";

    const normalizeSimulation = (sim: AdminSimulation) => {
        const normalizedAnalysis = sim.analysis_status || (sim.document_url ? "pending_analysis" : undefined);
        const normalizedStatus = sim.status || (sim.document_url ? "pending" : sim.status);
        return {
            ...sim,
            analysis_status: normalizedAnalysis,
            status: normalizedStatus
        };
    };

    const analysisList = (() => {
        const source = (analysisSimulations && analysisSimulations.length > 0)
            ? analysisSimulations
            : simulations || [];

        return source
            .map(normalizeSimulation)
            .filter((sim) => {
                const analysisStatus = (sim.analysis_status || "").toLowerCase();
                const status = (sim.status || "").toLowerCase();
                return (
                    analysisStatus === "pending_analysis"
                    || (!analysisStatus && ["pending", "simulation_requested", "approved"].includes(status))
                );
            });
    })();

    const pendingDocsList = (() => {
        const source = (analysisSimulations && analysisSimulations.length > 0)
            ? analysisSimulations
            : simulations || [];

        const normalized = source.map(normalizeSimulation);

        // DEBUG: Log todas as simulações e seus status
        console.log('🔍 DEBUG - Todas simulações:', normalized.map(s => ({
            id: s.id,
            user: s.user_name,
            status: s.status,
            analysis_status: s.analysis_status
        })));

        const filtered = normalized.filter((sim) => {
            const analysisStatus = (sim.analysis_status || "").toLowerCase();
            const isPending = analysisStatus === "pending_docs";

            if (isPending) {
                console.log('✅ Simulação PENDENTE encontrada:', {
                    id: sim.id,
                    user: sim.user_name,
                    analysis_status: sim.analysis_status
                });
            }

            return isPending;
        });

        console.log('📊 Total de simulações pendentes:', filtered.length);

        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    })();

    const statusTone: Record<string, string> = {
        pending: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
        simulation_requested: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
        approved: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
        approved_by_client: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
        cliente_aprovada: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
        simulacao_aprovada: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
        financeiro_pendente: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
        contrato_efetivado: "bg-emerald-600/20 text-emerald-200 border border-emerald-500/40",
        financeiro_cancelado: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
        rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/40",
        // Analysis status
        pending_analysis: "bg-purple-500/15 text-purple-200 border border-purple-500/40",
        pending_docs: "bg-orange-500/15 text-orange-200 border border-orange-500/40",
        approved_for_calculation: "bg-cyan-500/15 text-cyan-200 border border-cyan-500/40",
        reproved: "bg-red-500/15 text-red-200 border border-red-500/40"
    };

    const statusLabel: Record<string, string> = {
        pending: "Em análise",
        simulation_requested: "Em análise",
        approved: "Aguardando cliente",
        approved_by_client: "Aprovada pelo cliente",
        cliente_aprovada: "Aprovada pelo cliente",
        simulacao_aprovada: "Aprovada pelo cliente",
        financeiro_pendente: "No Financeiro",
        contrato_efetivado: "Contrato Efetivado",
        rejected: "Reprovada",
        financeiro_cancelado: "Cancelada pelo Financeiro",
        // Analysis status
        pending_analysis: "Pendente de Análise",
        pending_docs: "Documentos Pendentes",
        approved_for_calculation: "Simulação Pendente",
        reproved: "Reprovada na Análise"
    };

    // Client type labels and colors
    const clientTypeTone: Record<string, string> = {
        new_client: "bg-blue-500/20 text-blue-200 border border-blue-500/50",
        existing_client: "bg-green-500/20 text-green-200 border border-green-500/50"
    };

    const clientTypeLabel: Record<string, string> = {
        new_client: "Cliente Novo",
        existing_client: "Cliente Existente"
    };

    const getStatusTone = (status?: string) =>
        statusTone[(status || "").toLowerCase()] || defaultBadgeTone;

    const getStatusLabel = (status?: string) =>
        statusLabel[(status || "").toLowerCase()] || status || "Status";

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['mobile-simulations'], refetchType: 'all' });
        await queryClient.invalidateQueries({ queryKey: ['adminSimulations'] });
        await queryClient.refetchQueries({ queryKey: ['mobile-simulations', 'analysis'] });
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const filterSimulations = (status: string) => {
        if (!simulations) return [];
        let filtered = simulations.map(normalizeSimulation).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Remover itens que ainda estão em análise/pendentes quando não estamos nas abas específicas
        filtered = filtered.filter(sim => {
            const analysisStatus = (sim.analysis_status || "").toLowerCase();
            // Itens em análise só aparecem na tab "Análise"
            if (analysisStatus === "pending_analysis" && status !== "analise") {
                return false;
            }
            // Itens pendentes só aparecem na tab "Pendentes"
            if (analysisStatus === "pending_docs" && status !== "pendentes") {
                return false;
            }
            return true;
        });

        // Filter by status (consider grouped statuses + analysis_status)
        filtered = filtered.filter(sim => {
            const st = (sim.status || "").toLowerCase();
            const analysisStatus = (sim.analysis_status || "").toLowerCase();

            if (status === "pending") {
                return st === "pending" || st === "simulation_requested" || st === "approved";
            }
            if (status === "approved") {
                // Incluir simulações aprovadas pelo analista (approved_for_calculation) = "Simulação Pendente"
                if (analysisStatus === "approved_for_calculation") {
                    return true;
                }
                // Incluir simulações aprovadas pelo cliente
                return ["approved_by_client", "cliente_aprovada", "simulacao_aprovada", "financeiro_pendente", "contrato_efetivado"].includes(st);
            }
            if (status === "rejected") {
                // Incluir simulações reprovadas pelo analista
                if (analysisStatus === "reproved") {
                    return true;
                }
                // Incluir simulações rejeitadas ou canceladas
                return st === "rejected" || st === "financeiro_cancelado";
            }
            return true;
        });

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

    const renderSimulationCard = (sim: AdminSimulation, openModal = false) => {
        const normalized = normalizeSimulation(sim);
        const statusKey = (normalized.status || "").toLowerCase();
        const analysisStatusKey = (normalized.analysis_status || "").toLowerCase();

        const handleClick = () => {
            if (openModal) {
                setSelectedSimulation(normalized);
                setModalOpen(true);
            } else {
                router.push(`/life-mobile/simulacoes/${normalized.id}`);
            }
        };

        return (
            <Card
                key={normalized.id}
                className="cursor-pointer transition-shadow border bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:shadow-lg hover:shadow-black/40"
                style={{
                    borderLeftColor:
                        (statusKey === "rejected" || statusKey === "financeiro_cancelado") ? "#ef4444" :
                        statusKey === "financeiro_pendente" ? "#3b82f6" :
                        (["approved_by_client", "cliente_aprovada", "simulacao_aprovada", "contrato_efetivado"].includes(statusKey)) ? "#22c55e" :
                        "#f59e0b",
                    borderLeftWidth: 4
                }}
                onClick={handleClick}
            >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-100">{sim.user_name || "Usuário Desconhecido"}</h3>
                            <p className="text-sm text-slate-400">{sim.user_email}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <Badge
                                variant="outline"
                                className={getStatusTone(analysisStatusKey || statusKey)}
                            >
                                {statusLabel[analysisStatusKey] || getStatusLabel(statusKey)}
                            </Badge>
                            {sim.client_type && (
                                <Badge
                                    variant="outline"
                                    className={clientTypeTone[sim.client_type]}
                                >
                                    {clientTypeLabel[sim.client_type]}
                                    {sim.has_active_contract && " ✓"}
                                </Badge>
                            )}
                        </div>
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
    };

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Simulações</h1>
                    <p className="text-slate-400">Gerencie as simulações de crédito</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="border-slate-700 text-slate-100 hover:bg-slate-800"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                    <Button onClick={() => router.push('/life-mobile/simulacoes/nova')}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Simulação
                    </Button>
                </div>
            </div>

            {/* DEBUG PANEL */}
            <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-200 mb-2">🔍 Painel de Debug</h3>
                    <div className="text-xs space-y-1 text-slate-300">
                        <p>📊 Total de simulações: {simulations?.length || 0}</p>
                        <p>🔄 Total de análises: {analysisSimulations?.length || 0}</p>
                        <p>📋 Tab Análise: {analysisList.length} cards</p>
                        <p>⏳ Tab Pendentes: {pendingDocsList.length} cards</p>
                        <p className="text-blue-200 mt-2">💡 Abra o Console (F12) para ver logs detalhados</p>
                    </div>
                </CardContent>
            </Card>

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
                <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-900/70 border border-slate-800">
                    <TabsTrigger value="analise">Análise</TabsTrigger>
                    <TabsTrigger value="pendentes">
                        Pendentes
                        {pendingDocsList.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500/20 text-orange-300 rounded-full">
                                {pendingDocsList.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="pending">Simulações</TabsTrigger>
                    <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                    <TabsTrigger value="rejected">Reprovadas</TabsTrigger>
                </TabsList>

                <TabsContent value="analise">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoadingAnalysis ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                        ) : analysisList.length === 0 ? (
                            <p className="text-slate-500 col-span-full text-center py-8">Nenhuma simulação pendente de análise.</p>
                        ) : (
                            analysisList.map(sim => renderSimulationCard(sim, true))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pendentes">
                    <div className="space-y-4">
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-orange-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-orange-200">Aguardando Documentação</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Simulações pendenciadas aguardando envio de documentos pelos clientes.
                                        O cliente foi notificado via app mobile.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {isLoadingAnalysis ? (
                                <p className="text-slate-500 col-span-full text-center py-8">Carregando...</p>
                            ) : pendingDocsList.length === 0 ? (
                                <p className="text-slate-500 col-span-full text-center py-8">
                                    Nenhuma simulação aguardando documentos.
                                </p>
                            ) : (
                                pendingDocsList.map(sim => renderSimulationCard(sim, true))
                            )}
                        </div>
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

            <AnalysisModal
                simulation={selectedSimulation}
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedSimulation(null);
                }}
            />
        </div>
    );
}
