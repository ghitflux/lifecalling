"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    User,
    Calendar,
    CheckCircle,
    XCircle,
    DollarSign,
    FileText,
    Download,
    Paperclip,
    CreditCard
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge
} from "@lifecalling/ui";
import { mobileApi } from "@/services/mobileApi";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";
import { useMemo } from "react";

type BankEntry = {
    bank?: string;
    banco?: string;
    product?: string;
    parcela?: number;
    saldoDevedor?: number;
    valorLiberado?: number;
};

export default function SimulationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = params.id as string;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const statusTone: Record<string, string> = {
        approved: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
        pending: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
        rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/30"
    };

    const statusLabel: Record<string, string> = {
        approved: "Aprovado",
        pending: "Pendente",
        rejected: "Reprovado",
        "approved_by_client": "Aprovada pelo Cliente",
        "cliente_aprovada": "Aprovada pelo Cliente"
    };

    const productInfo: Record<string, { label: string; icon: JSX.Element }> = {
        emprestimo_consignado: { label: "Empréstimo Consignado", icon: <FileText className="h-4 w-4" /> },
        cartao_beneficio: { label: "Cartão Benefício", icon: <CreditCard className="h-4 w-4" /> },
        cartao_consignado: { label: "Cartão Consignado", icon: <CreditCard className="h-4 w-4" /> },
        abase_auxilio: { label: "Abase Auxílio", icon: <DollarSign className="h-4 w-4" /> },
    };

    const productLabels: Record<string, string> = {
        emprestimo_consignado: "Empréstimo Consignado",
        cartao_beneficio: "Cartão Benefício",
        cartao_consignado: "Cartão Consignado",
        abase_auxilio: "Abase Auxílio"
    };

    const { data: simulation, isLoading } = useQuery({
        queryKey: ["adminSimulation", id],
        queryFn: () => mobileApi.getAdminSimulationById(id),
        enabled: Boolean(id)
    });

    const { data: allSimulations } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const banks: BankEntry[] = (simulation?.banks_json as BankEntry[] | undefined) || [];
    const totals = useMemo(() => {
        if (!simulation) {
            return {
                totalParcela: 0,
                saldoTotal: 0,
                liberadoTotal: 0,
                seguroObrigatorio: 0,
                totalFinanciado: 0,
                custoConsultoria: 0,
                valorLiquido: 0,
                liberadoCliente: 0
            };
        }

        const totalParcela = banks.reduce((sum, b) => sum + (b.parcela || 0), 0);
        const saldoTotal = banks.reduce((sum, b) => sum + (b.saldoDevedor || 0), 0);
        const liberadoTotal = banks.reduce((sum, b) => sum + (b.valorLiberado || 0), 0);
        const seguroObrigatorio = simulation.seguro ?? 0;
        const totalFinanciado = simulation.total_amount ?? simulation.requested_amount ?? liberadoTotal;
        const custoConsultoria = ((simulation.percentual_consultoria ?? 0) / 100) * totalFinanciado;
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
    }, [banks, simulation]);

    const history = useMemo(() => {
        if (!allSimulations || !simulation?.user_email) return [];
        return allSimulations
            .filter((sim) => sim.user_email === simulation.user_email)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [allSimulations, simulation?.user_email]);

    const approveMutation = useMutation({
        mutationFn: () => mobileApi.approveSimulation(id),
        onSuccess: () => {
            toast.success("Simulação aprovada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["adminSimulation", id] });
            queryClient.invalidateQueries({ queryKey: ["adminSimulations"] });
        },
        onError: () => {
            toast.error("Erro ao aprovar simulação");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: () => mobileApi.rejectSimulation(id),
        onSuccess: () => {
            toast.success("Simulação reprovada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["adminSimulation", id] });
            queryClient.invalidateQueries({ queryKey: ["adminSimulations"] });
        },
        onError: () => {
            toast.error("Erro ao reprovar simulação");
        }
    });

    const handleDownloadDocument = async () => {
        if (!simulation?.document_url) return;

        try {
            window.open(`${apiBaseUrl}/mobile/admin/documents/${id}`, "_blank");
            toast.success("Download iniciado");
        } catch (error) {
            toast.error("Erro ao fazer download");
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">Carregando detalhes...</div>;
    }

    if (!simulation) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Simulação não encontrada</h1>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-slate-200" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Simulação #{simulation.id}</h1>
                        <p className="text-slate-400">Visualizar e gerenciar simulação mobile</p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={statusTone[simulation.status] || "bg-slate-800 text-slate-200 border border-slate-700"}
                >
                    {statusLabel[simulation.status] || simulation.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Client Info and Simulation Data */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Information Card */}
                    <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <User className="h-5 w-5 text-indigo-300" />
                                Informações do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-slate-200">
                            <div>
                                <p className="text-sm text-slate-400">Nome</p>
                                <p className="font-medium">{simulation.user_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Email</p>
                                <p className="font-medium">{simulation.user_email}</p>
                            </div>
                            {simulation.user_cpf && (
                                <div>
                                    <p className="text-sm text-slate-400">CPF</p>
                                    <p className="font-medium">{simulation.user_cpf}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-slate-400">WhatsApp</p>
                                {simulation.user_phone ? (
                                    <a
                                        className="font-medium text-emerald-300 hover:text-emerald-200"
                                        href={`https://wa.me/${String(simulation.user_phone).replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {simulation.user_phone}
                                    </a>
                                ) : (
                                    <p className="font-medium text-slate-500">-</p>
                                )}
                            </div>
                            {simulation.user_matricula && (
                                <div>
                                    <p className="text-sm text-slate-400">Matrícula</p>
                                    <p className="font-medium">{simulation.user_matricula}</p>
                                </div>
                            )}
                            {simulation.user_orgao && (
                                <div className="col-span-2">
                                    <p className="text-sm text-slate-400">Órgão</p>
                                    <p className="font-medium">{simulation.user_orgao}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-slate-400">Data da Solicitação</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    {new Date(simulation.created_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simulation Data Card */}
                    <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <FileText className="h-5 w-5 text-indigo-300" />
                                Dados da Simulação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-slate-200">
                            <div>
                                <p className="text-sm text-slate-400">Produto</p>
                                    <p className="font-medium capitalize">
                                        {simulation.type?.replace(/_/g, ' ') || simulation.simulation_type?.replace(/_/g, ' ') || 'N/A'}
                                    </p>
                                    {simulation.type && productInfo[simulation.type] && (
                                        <div className="mt-2">
                                            <Badge className="bg-slate-800 text-slate-100 border-slate-700 gap-1">
                                                {productInfo[simulation.type].icon}
                                                {productInfo[simulation.type].label}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            <div>
                                <p className="text-sm text-slate-400">Valor Solicitado</p>
                                <p className="font-medium">{formatCurrency(simulation.amount || simulation.requested_amount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Parcelas</p>
                                <p className="font-medium">{simulation.installments}x</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Taxa de Juros</p>
                                <p className="font-medium">{simulation.interest_rate}%</p>
                            </div>
                            {simulation.prazo && (
                                <div>
                                    <p className="text-sm text-slate-400">Prazo</p>
                                    <p className="font-medium">{simulation.prazo} meses</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {banks.length > 0 && (
                        <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-100">
                                    <DollarSign className="h-5 w-5 text-indigo-300" />
                                    Detalhes por Banco
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {banks.map((bank, index) => {
                                    const bankName = bank.bank || bank.banco || `Banco ${index + 1}`;
                                    const productLabel = bank.product
                                        ? productLabels[bank.product] || bank.product.replace(/_/g, " ")
                                        : "Produto não informado";
                                    const productChip = bank.product && productInfo[bank.product];

                                    return (
                                        <div
                                            key={`${bankName}-${index}`}
                                            className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-slate-900 text-slate-200 border-slate-700">
                                                        Banco {index + 1}
                                                    </Badge>
                                                    <span className="font-semibold text-slate-100">{bankName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    {productChip ? (
                                                        <Badge className="bg-slate-800 text-slate-100 border-slate-700 gap-1">
                                                            {productChip.icon}
                                                            {productChip.label}
                                                        </Badge>
                                                    ) : null}
                                                    <span>{productLabel}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
                                                <div>
                                                    <p className="text-xs text-slate-500">Parcela</p>
                                                    <p className="font-semibold text-slate-100">{formatCurrency(bank.parcela || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Saldo devedor</p>
                                                    <p className="font-semibold text-slate-100">
                                                        {bank.saldoDevedor ? formatCurrency(bank.saldoDevedor) : "Sem saldo"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Valor liberado</p>
                                                    <p className="font-semibold text-emerald-300">{formatCurrency(bank.valorLiberado || 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Attachments Card */}
                    {simulation.document_url && (
                        <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-100">
                                    <Paperclip className="h-5 w-5 text-indigo-300" />
                                    Anexos do Caso (1)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-10 w-10 text-indigo-300" />
                                        <div>
                                            <p className="font-medium text-slate-100">
                                                {simulation.document_filename || 'Documento anexado'}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {simulation.document_type?.toUpperCase()} • {new Date(simulation.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-100 hover:bg-slate-800"
                                        onClick={handleDownloadDocument}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Results & Actions */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {simulation.status === 'pending' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => rejectMutation.mutate()}
                                    disabled={rejectMutation.isPending || approveMutation.isPending}
                                >
                                    {rejectMutation.isPending ? "Reprovando..." : (
                                        <>
                                            <XCircle className="mr-2 h-4 w-4" /> Reprovar
                                        </>
                                    )}
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => approveMutation.mutate()}
                                    disabled={rejectMutation.isPending || approveMutation.isPending}
                                >
                                    {approveMutation.isPending ? "Aprovando..." : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                        {isCustomerApproved && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending}
                            >
                                {approveMutation.isPending ? "Enviando..." : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Revisar e Enviar ao Financeiro
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-indigo-700/40 shadow-xl shadow-black/40">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-slate-100">
                                    <DollarSign className="h-5 w-5 text-emerald-300" />
                                    Resultado da Simulação
                                </CardTitle>
                                <Badge className={statusTone[simulation.status] || "bg-slate-800 text-slate-200 border border-slate-700"}>
                                    {statusLabel[simulation.status] || simulation.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-200">
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
                                <span className="text-sm text-slate-400">Seguro Obrigatório</span>
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
                                <span className="text-2xl font-bold text-emerald-300">{formatCurrency(totals.liberadoCliente)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Valor Parcela (registro)</span>
                                <span className="font-semibold">{formatCurrency(simulation.installment_value || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Valor Total (registro)</span>
                                <span className="font-semibold">{formatCurrency(simulation.total_amount || 0)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <Paperclip className="h-5 w-5 text-indigo-300" />
                                Anexos do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {simulation.document_url ? (
                                <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-10 w-10 text-indigo-300" />
                                        <div>
                                            <p className="font-medium text-slate-100">
                                                {simulation.document_filename || 'Documento anexado'}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {simulation.document_type?.toUpperCase()} • {new Date(simulation.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-100 hover:bg-slate-800"
                                        onClick={handleDownloadDocument}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Nenhum anexo para esta simulação.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Histórico */}
            {history.length > 0 && (
                <Card className="bg-slate-900/80 border border-slate-800 shadow-lg shadow-black/40">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Histórico de Simulações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {history.map((sim) => (
                            <div
                                key={sim.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${sim.id === simulation.id ? "border-indigo-500/60 bg-indigo-950/30" : "border-slate-800 bg-slate-950/40"}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-100">#{sim.id} · {sim.user_name || "Cliente"}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(sim.created_at).toLocaleDateString("pt-BR")} · {sim.type?.replace(/_/g, " ")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant="outline"
                                        className={statusTone[sim.status] || "bg-slate-800 text-slate-200 border border-slate-700"}
                                    >
                                        {statusLabel[sim.status] || sim.status}
                                    </Badge>
                                    {sim.id !== simulation.id && (
                                        <Button variant="ghost" className="text-indigo-300 hover:text-indigo-200" onClick={() => router.push(`/life-mobile/simulacoes/${sim.id}`)}>
                                            Ver
                                        </Button>
                                    )}
                                    {sim.id === simulation.id && (
                                        <span className="text-xs text-indigo-200">Atual</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
    const isCustomerApproved = (simulation?.status || "").toLowerCase().includes("approved_by_client") || (simulation?.status || "").toLowerCase().includes("cliente");
