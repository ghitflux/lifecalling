"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Search,
    Filter,
    ChevronRight
} from "lucide-react";
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

    const filterSimulations = (status: string) => {
        if (!simulations) return [];
        let filtered = simulations;

        // Filter by status
        if (status !== "todas") {
            filtered = filtered.filter(sim => sim.status === status);
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
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
            style={{
                borderLeftColor:
                    sim.status === 'approved' ? '#10b981' :
                        sim.status === 'rejected' ? '#ef4444' :
                            '#f59e0b'
            }}
            onClick={() => router.push(`/life-mobile/simulacoes/${sim.id}`)}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-900">{sim.user_name || 'Usuário Desconhecido'}</h3>
                        <p className="text-sm text-gray-500">{sim.user_email}</p>
                    </div>
                    <Badge
                        variant={sim.status === 'rejected' ? 'destructive' : 'outline'}
                        className={
                            sim.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                sim.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                        }
                    >
                        {sim.status === 'pending' ? 'Pendente' :
                            sim.status === 'approved' ? 'Aprovado' :
                                'Reprovado'}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                        <p className="text-gray-500">Valor</p>
                        <p className="font-medium">R$ {sim.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Tipo</p>
                        <p className="font-medium capitalize">{sim.type}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Parcelas</p>
                        <p className="font-medium">{sim.installments}x</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Data</p>
                        <p className="font-medium">{new Date(sim.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div className="flex justify-end items-center text-blue-600 text-sm font-medium">
                    Ver detalhes <ChevronRight size={16} />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Simulações</h1>
                    <p className="text-gray-500">Gerencie as simulações de crédito</p>
                </div>
                <Button onClick={() => router.push('/life-mobile/simulacoes/nova')}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Simulação
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por cliente, email ou tipo..."
                        className="pl-9 border-0 bg-gray-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                    <TabsTrigger value="rejected">Reprovadas</TabsTrigger>
                </TabsList>

                <TabsContent value="todas">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <p>Carregando...</p>
                        ) : filterSimulations("todas").length === 0 ? (
                            <p className="text-gray-500 col-span-full text-center py-8">Nenhuma simulação encontrada.</p>
                        ) : (
                            filterSimulations("todas").map(renderSimulationCard)
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pending">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterSimulations("pending").map(renderSimulationCard)}
                    </div>
                </TabsContent>

                <TabsContent value="approved">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterSimulations("approved").map(renderSimulationCard)}
                    </div>
                </TabsContent>

                <TabsContent value="rejected">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterSimulations("rejected").map(renderSimulationCard)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
