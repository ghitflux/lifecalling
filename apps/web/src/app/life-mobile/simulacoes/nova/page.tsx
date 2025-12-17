"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, User, CheckCircle, Send, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, SimpleSelect, Badge } from "@lifecalling/ui";
import { Snippet } from "@nextui-org/snippet";
import { mobileApi, AdminClient, AdminSimulation } from "@/services/mobileApi";
import { toast } from "sonner";
import { SimulationFormMultiBank } from "@/components/mobile/SimulationFormMultiBank";
import { formatCurrency } from "@/lib/utils/currency";

const copyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
);

function NewSimulationPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedClient, setSelectedClient] = useState("");
    const [createdSimulation, setCreatedSimulation] = useState<AdminSimulation | null>(null);

    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ["adminClients"],
        queryFn: mobileApi.getAdminClients,
    });
    const { data: simulations } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        const clientIdParam = searchParams.get("clientId");
        if (clientIdParam) {
            setSelectedClient(clientIdParam);
        }
    }, [searchParams]);

    const createSimulationMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!selectedClient) {
                throw new Error("Selecione um cliente");
            }

            // Calculate totals
            const totalParcela = data.banks.reduce((acc: number, bank: any) => acc + bank.parcela, 0);
            const totalLiberado = data.banks.reduce((acc: number, bank: any) => acc + bank.valorLiberado, 0);

            return mobileApi.createAdminSimulation({
                user_id: parseInt(selectedClient),
                simulation_type: "multi_bank",
                requested_amount: totalLiberado,
                installments: data.prazo,
                interest_rate: 0,
                installment_value: totalParcela,
                total_amount: totalLiberado,
                banks_json: data.banks,
                prazo: data.prazo,
                coeficiente: data.coeficiente,
                seguro: data.seguro,
                percentual_consultoria: data.percentualConsultoria
            });
        },
        onSuccess: (sim) => {
            setCreatedSimulation(sim);
            toast.success("Simulação calculada. Revise e envie para o app.");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.message || "Erro ao salvar simulação");
        }
    });

    const approveSimulationMutation = useMutation({
        mutationFn: async () => {
            if (!createdSimulation?.id) throw new Error("Nenhuma simulação para aprovar");
            await mobileApi.approveSimulation(createdSimulation.id as unknown as string);
        },
        onSuccess: () => {
            toast.success("Simulação enviada/aprovada para o app.");
            router.push("/life-mobile/simulacoes");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.message || "Erro ao enviar/aprovar simulação");
        }
    });

    const handleCalculate = (data: any) => {
        setCreatedSimulation(null);
        createSimulationMutation.mutate(data);
    };

    const totals = useMemo(() => {
        if (!createdSimulation) {
            return null;
        }

        const banks = createdSimulation.banks_json || [];
        const totalParcela = banks.reduce((sum: number, b: any) => sum + (b.parcela || 0), 0);
        const saldoTotal = banks.reduce((sum: number, b: any) => sum + (b.saldoDevedor || 0), 0);
        const liberadoTotal = banks.reduce((sum: number, b: any) => sum + (b.valorLiberado || 0), 0);
        const seguroObrigatorio = createdSimulation.seguro ?? 0;
        const totalFinanciado = createdSimulation.total_amount ?? createdSimulation.requested_amount ?? liberadoTotal;
        const custoConsultoria = ((createdSimulation.percentual_consultoria ?? 0) / 100) * totalFinanciado;
        const valorLiquido = liberadoTotal - seguroObrigatorio - custoConsultoria;

        return {
            totalParcela,
            saldoTotal,
            liberadoTotal,
            seguroObrigatorio,
            totalFinanciado,
            custoConsultoria,
            valorLiquido,
            liberadoCliente: valorLiquido
        };
    }, [createdSimulation]);

    const selectedClientData = useMemo(
        () => clients?.find((c) => c.id.toString() === selectedClient),
        [clients, selectedClient]
    );

    const latestSimulationWithDoc = useMemo(() => {
        if (!simulations || !selectedClientData) return null;
        const sims = simulations
            .filter((sim) => sim.user_email === selectedClientData.email)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
        return sims.find((sim) => sim.document_url);
    }, [simulations, selectedClientData]);

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-200" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nova Simulação</h1>
                    <p className="text-slate-400">Criar nova simulação multi-bancos para cliente mobile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seleção de Cliente */}
                <Card className="mb-6 lg:col-span-2 bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-100">
                            <User className="h-5 w-5 text-indigo-300" />
                            Selecione o Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Cliente Mobile *</label>
                            {clientsLoading ? (
                                <div className="h-10 bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <SimpleSelect
                                    value={selectedClient}
                                    onValueChange={setSelectedClient}
                                    placeholder="Selecione um cliente..."
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clients?.map((client: AdminClient) => (
                                        <option key={client.id} value={client.id.toString()}>
                                            {client.name} ({client.email})
                                        </option>
                                    ))}
                                </SimpleSelect>
                            )}
                            {!selectedClient && (
                                <p className="text-xs text-slate-400">
                                    Selecione um cliente antes de preencher a simulação
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Formulário de Simulação */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedClientData && (
                        <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Informações do Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-200">
                                <div>
                                    <p className="text-sm text-slate-400">Nome</p>
                                    <p className="font-semibold">{selectedClientData.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Email</p>
                                    <p className="font-semibold">{selectedClientData.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">CPF</p>
                                    <Snippet
                                        symbol=""
                                        classNames={{ base: "bg-muted text-slate-100 border border-slate-800 rounded-md", pre: "font-mono text-xs" }}
                                        copyIcon={copyIcon}
                                        onCopy={() => navigator.clipboard.writeText((selectedClientData.cpf || "").replace(/\D/g, ""))}
                                    >
                                        {selectedClientData.cpf || "-"}
                                    </Snippet>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">WhatsApp</p>
                                    <Snippet
                                        symbol=""
                                        classNames={{ base: "bg-muted text-slate-100 border border-slate-800 rounded-md", pre: "font-mono text-xs flex items-center gap-2" }}
                                        copyIcon={copyIcon}
                                        onCopy={() => navigator.clipboard.writeText((selectedClientData.phone || "").replace(/\D/g, ""))}
                                    >
                                        {selectedClientData.phone || "-"}
                                    </Snippet>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {latestSimulationWithDoc && (
                        <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Anexos do Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <User className="h-10 w-10 text-indigo-300" />
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            {latestSimulationWithDoc.document_filename || 'Documento anexado'}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {latestSimulationWithDoc.document_type?.toUpperCase()} • {new Date(latestSimulationWithDoc.updated_at || latestSimulationWithDoc.created_at).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-100 hover:bg-slate-800"
                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/mobile/admin/documents/${latestSimulationWithDoc.id}`, "_blank")}
                                >
                                    <Send className="h-4 w-4 mr-2 rotate-90" />
                                    Baixar
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {selectedClient ? (
                        <SimulationFormMultiBank
                            onCalculate={handleCalculate}
                            loading={createSimulationMutation.isPending}
                        />
                    ) : (
                        <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                            <CardContent className="py-12 text-center text-slate-400">
                                <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Selecione um cliente para iniciar a simulação</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Resultado da simulação */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-900/80 border border-indigo-700/40 shadow-lg shadow-black/40 h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <CheckCircle className="h-5 w-5 text-emerald-300" />
                                Resultado da Simulação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-slate-200">
                            {createdSimulation && totals ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Valor Parcela Total</span>
                                        <span className="font-semibold">{formatCurrency(totals.totalParcela)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Saldo Devedor Total</span>
                                        <span className="font-semibold">{formatCurrency(totals.saldoTotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Valor Liberado Total</span>
                                        <span className="font-semibold text-emerald-300">{formatCurrency(totals.liberadoTotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Seguro Obrigatório Banco</span>
                                        <span className="font-semibold">{formatCurrency(totals.seguroObrigatorio)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Valor Total Financiado</span>
                                        <span className="font-semibold">{formatCurrency(totals.totalFinanciado)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Custo Consultoria</span>
                                        <span className="font-semibold">{formatCurrency(totals.custoConsultoria)}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3">
                                        <span className="text-sm text-emerald-300 font-semibold">Liberado para o Cliente</span>
                                        <span className="text-xl font-bold text-emerald-300">{formatCurrency(totals.liberadoCliente)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm text-slate-400">Status</span>
                                        <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40">Pendente</Badge>
                                    </div>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => approveSimulationMutation.mutate()}
                                        disabled={approveSimulationMutation.isPending}
                                    >
                                        {approveSimulationMutation.isPending ? "Enviando..." : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Enviar/Aprovar no App
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-slate-500 text-sm">
                                    Calcule a simulação para visualizar o resultado e enviar para o app.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function NewSimulationPage() {
    return (
        <Suspense fallback={
            <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-800 animate-pulse rounded" />
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded" />
                        <div className="h-4 w-64 bg-slate-800 animate-pulse rounded" />
                    </div>
                </div>
            </div>
        }>
            <NewSimulationPageContent />
        </Suspense>
    );
}
