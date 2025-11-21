"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    User,
    CreditCard,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    FileText,
    Download,
    Paperclip
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

export default function SimulationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = parseInt(params.id as string);

    const { data: simulation, isLoading } = useQuery({
        queryKey: ["adminSimulation", id],
        queryFn: () => mobileApi.getAdminSimulationById(id),
        enabled: !!id
    });

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
            window.open(`${process.env.NEXT_PUBLIC_API_URL}/mobile/admin/documents/${id}`, '_blank');
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
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Simulação #{simulation.id}</h1>
                        <p className="text-gray-500">Visualizar e gerenciar simulação mobile</p>
                    </div>
                </div>
                <Badge
                    variant={simulation.status === 'rejected' ? 'destructive' : 'outline'}
                    className={
                        simulation.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            simulation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                    }
                >
                    {simulation.status === 'pending' ? 'Pendente' :
                        simulation.status === 'approved' ? 'Aprovado' :
                            'Reprovado'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Client Info and Simulation Data */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Informações do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Nome</p>
                                <p className="font-medium text-gray-900">{simulation.user_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{simulation.user_email}</p>
                            </div>
                            {simulation.user_cpf && (
                                <div>
                                    <p className="text-sm text-gray-500">CPF</p>
                                    <p className="font-medium text-gray-900">{simulation.user_cpf}</p>
                                </div>
                            )}
                            {simulation.user_matricula && (
                                <div>
                                    <p className="text-sm text-gray-500">Matrícula</p>
                                    <p className="font-medium text-gray-900">{simulation.user_matricula}</p>
                                </div>
                            )}
                            {simulation.user_orgao && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Órgão</p>
                                    <p className="font-medium text-gray-900">{simulation.user_orgao}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Data da Solicitação</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {new Date(simulation.created_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simulation Data Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Dados da Simulação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Produto</p>
                                <p className="font-medium text-gray-900 capitalize">
                                    {simulation.type?.replace(/_/g, ' ') || simulation.simulation_type?.replace(/_/g, ' ') || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Valor Solicitado</p>
                                <p className="font-medium text-gray-900">
                                    R$ {(simulation.amount || simulation.requested_amount)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Parcelas</p>
                                <p className="font-medium text-gray-900">{simulation.installments}x</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Taxa de Juros</p>
                                <p className="font-medium text-gray-900">{simulation.interest_rate}%</p>
                            </div>
                            {simulation.prazo && (
                                <div>
                                    <p className="text-sm text-gray-500">Prazo</p>
                                    <p className="font-medium text-gray-900">{simulation.prazo} meses</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attachments Card */}
                    {simulation.document_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Paperclip className="h-5 w-5 text-blue-600" />
                                    Anexos do Caso (1)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-10 w-10 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {simulation.document_filename || 'Documento anexado'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {simulation.document_type?.toUpperCase()} • {new Date(simulation.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
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

                {/* Right Column - Results */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Resultado da Simulação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Valor da Parcela</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    R$ {simulation.installment_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    R$ {simulation.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            {simulation.banks_json && simulation.banks_json.length > 0 && (
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <p className="text-sm text-gray-500 mb-1">Bancos</p>
                                    <p className="font-medium text-gray-900">{simulation.banks_json.length} banco(s)</p>
                                </div>
                            )}
                            {simulation.seguro && (
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <p className="text-sm text-gray-500 mb-1">Seguro Obrigatório</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        R$ {simulation.seguro?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                            {simulation.percentual_consultoria && (
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <p className="text-sm text-gray-500 mb-1">% Consultoria</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {simulation.percentual_consultoria}%
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Buttons */}
            {simulation.status === 'pending' && (
                <div className="flex justify-end gap-4 pt-4 border-t">
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
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate()}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                    >
                        {approveMutation.isPending ? "Aprovando..." : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
