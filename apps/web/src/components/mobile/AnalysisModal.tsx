"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Badge,
    Input,
    Textarea,
    Label,
    Card,
    CardContent,
} from "@lifecalling/ui";
import { AdminSimulation, PendingDocument, mobileApi } from "@/services/mobileApi";
import {
    usePendSimulation,
    useReproveSimulation,
    useApproveForCalculation,
    useDownloadSimulationDocument,
} from "@/hooks/useMobileAnalysis";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";
import { FileText, Download, Plus, X, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";

interface AnalysisModalProps {
    simulation: AdminSimulation | null;
    open: boolean;
    onClose: () => void;
}

export function AnalysisModal({ simulation, open, onClose }: AnalysisModalProps) {
    const [action, setAction] = useState<"pend" | "reprove" | "approve" | null>(null);
    const [notes, setNotes] = useState("");
    const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
    const [newDocType, setNewDocType] = useState("");
    const [newDocDescription, setNewDocDescription] = useState("");

    const pendMutation = usePendSimulation();
    const reproveMutation = useReproveSimulation();
    const approveMutation = useApproveForCalculation();
    const downloadMutation = useDownloadSimulationDocument();

    if (!simulation) return null;

    const handleAddPendingDoc = () => {
        if (newDocType && newDocDescription) {
            setPendingDocs([...pendingDocs, { type: newDocType, description: newDocDescription }]);
            setNewDocType("");
            setNewDocDescription("");
        }
    };

    const handleRemovePendingDoc = (index: number) => {
        setPendingDocs(pendingDocs.filter((_, i) => i !== index));
    };

    const handleConfirmAction = async () => {
        if (!action) return;

        try {
            if (action === "pend") {
                if (!notes || pendingDocs.length === 0) {
                    toast.error("Preencha as observações e adicione pelo menos um documento pendente");
                    return;
                }
                await pendMutation.mutateAsync({
                    id: simulation.id,
                    data: { analyst_notes: notes, pending_documents: pendingDocs },
                });
            } else if (action === "reprove") {
                if (!notes) {
                    toast.error("Preencha o motivo da reprovação");
                    return;
                }
                await reproveMutation.mutateAsync({
                    id: simulation.id,
                    data: { analyst_notes: notes },
                });
            } else if (action === "approve") {
                await approveMutation.mutateAsync({
                    id: simulation.id,
                    data: { analyst_notes: notes || undefined },
                });
            }

            // Aguardar um pouco para garantir que as queries foram invalidadas
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reset state and close
            setAction(null);
            setNotes("");
            setPendingDocs([]);
            onClose();
        } catch (error) {
            console.error("Error processing action:", error);
        }
    };

    const handleDownloadDocument = async () => {
        if (simulation.document_url) {
            await downloadMutation.mutateAsync({
                simulationId: simulation.id,
                documentType: simulation.document_type,
                filename: simulation.document_filename
            });
        }
    };

    const handleViewDocument = async () => {
        if (simulation.document_url) {
            try {
                const blob = await mobileApi.getSimulationDocument(simulation.id);
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');

                // Limpar URL após algum tempo
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 60000); // 1 minuto

                toast.success('Visualização aberta em nova aba!');
            } catch (error) {
                toast.error('Erro ao visualizar documento');
                console.error('Error viewing document:', error);
            }
        }
    };

    const clientTypeTone =
        simulation.client_type === "new_client"
            ? "bg-blue-500/20 text-blue-200 border border-blue-500/50"
            : "bg-green-500/20 text-green-200 border border-green-500/50";

    const clientTypeLabel =
        simulation.client_type === "new_client" ? "Cliente Novo" : "Cliente Existente";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Análise de Simulação</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Analise os dados do cliente e tome uma ação
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Cliente Info */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{simulation.user_name}</h3>
                                    <p className="text-sm text-slate-400">{simulation.user_email}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {simulation.client_type && (
                                        <Badge variant="outline" className={clientTypeTone}>
                                            {clientTypeLabel}
                                            {simulation.has_active_contract && " ✓ Contrato Ativo"}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">CPF</p>
                                    <p className="font-medium">{simulation.user_cpf || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Matrícula</p>
                                    <p className="font-medium">{simulation.user_matricula || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Órgão</p>
                                    <p className="font-medium">{simulation.user_orgao || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Telefone</p>
                                    <p className="font-medium">{simulation.user_phone || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simulação Info */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <h4 className="font-semibold mb-3">Dados da Simulação</h4>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Valor Liberado</p>
                                    <p className="font-medium text-lg text-indigo-400">
                                        {formatCurrency(simulation.total_amount || simulation.requested_amount || 0)}
                                    </p>
                                </div>

                                {simulation.banks_json && simulation.banks_json.length > 0 && (
                                    <>
                                        <div>
                                            <p className="text-slate-400 mb-2">Produtos</p>
                                            <div className="flex flex-wrap gap-2">
                                                {simulation.banks_json
                                                    .filter((bank: any) => bank.product)
                                                    .map((bank: any, index: number) => (
                                                        <Badge
                                                            key={`product-${index}`}
                                                            variant="outline"
                                                            className="bg-indigo-500/15 text-indigo-200 border border-indigo-500/40"
                                                        >
                                                            {bank.product}
                                                        </Badge>
                                                    ))}
                                                {simulation.banks_json.filter((bank: any) => bank.product).length === 0 && (
                                                    <span className="text-slate-500 text-sm italic">Nenhum produto especificado</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-slate-400 mb-2">Bancos</p>
                                            <div className="flex flex-wrap gap-2">
                                                {simulation.banks_json.map((bank: any, index: number) => (
                                                    <Badge
                                                        key={`bank-${index}`}
                                                        variant="outline"
                                                        className="bg-slate-700/50 text-slate-100 border border-slate-600"
                                                    >
                                                        {(bank.bank || bank.banco || 'Banco').toString().toUpperCase()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <p className="text-slate-400">Data de Criação</p>
                                    <p className="font-medium">
                                        {new Date(simulation.created_at).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentos */}
                    {simulation.document_url && (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-4">
                                <h4 className="font-semibold mb-3">Documentos Anexados</h4>
                                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                        <div>
                                            <p className="font-medium">{simulation.document_filename}</p>
                                            <p className="text-sm text-slate-400">
                                                Tipo: {simulation.document_type?.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleViewDocument}
                                            className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Visualizar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleDownloadDocument}
                                            disabled={downloadMutation.isPending}
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            {downloadMutation.isPending ? "Baixando..." : "Baixar"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Form */}
                    {!action && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setAction("pend")}
                                variant="outline"
                                className="flex-1 border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
                            >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Pendenciar
                            </Button>
                            <Button
                                onClick={() => setAction("reprove")}
                                variant="outline"
                                className="flex-1 border-red-500/50 text-red-300 hover:bg-red-500/10"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reprovar
                            </Button>
                            <Button
                                onClick={() => setAction("approve")}
                                variant="outline"
                                className="flex-1 border-green-500/50 text-green-300 hover:bg-green-500/10"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprovar
                            </Button>
                        </div>
                    )}

                    {/* Pend Form */}
                    {action === "pend" && (
                        <Card className="bg-orange-500/10 border-orange-500/30">
                            <CardContent className="p-4 space-y-4">
                                <h4 className="font-semibold text-orange-200">Pendenciar Simulação</h4>

                                <div>
                                    <Label htmlFor="pend-notes">Observações</Label>
                                    <Textarea
                                        id="pend-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Descreva o motivo da pendência..."
                                        className="bg-slate-900 border-slate-700 text-slate-100"
                                    />
                                </div>

                                <div>
                                    <Label>Documentos Pendentes</Label>
                                    <div className="space-y-2 mt-2">
                                        {pendingDocs.map((doc, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-slate-900 p-2 rounded"
                                            >
                                                <div>
                                                    <p className="font-medium">{doc.type}</p>
                                                    <p className="text-sm text-slate-400">{doc.description}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemovePendingDoc(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="Tipo (ex: RG, CPF)"
                                                value={newDocType}
                                                onChange={(e) => setNewDocType(e.target.value)}
                                                className="bg-slate-900 border-slate-700"
                                            />
                                            <Input
                                                placeholder="Descrição"
                                                value={newDocDescription}
                                                onChange={(e) => setNewDocDescription(e.target.value)}
                                                className="bg-slate-900 border-slate-700"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddPendingDoc}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar Documento
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => setAction(null)} variant="outline" className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmAction}
                                        disabled={pendMutation.isPending}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                                    >
                                        {pendMutation.isPending ? "Processando..." : "Confirmar Pendência"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reprove Form */}
                    {action === "reprove" && (
                        <Card className="bg-red-500/10 border-red-500/30">
                            <CardContent className="p-4 space-y-4">
                                <h4 className="font-semibold text-red-200">Reprovar Simulação</h4>

                                <div>
                                    <Label htmlFor="reprove-notes">Motivo da Reprovação</Label>
                                    <Textarea
                                        id="reprove-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Descreva o motivo da reprovação..."
                                        className="bg-slate-900 border-slate-700 text-slate-100"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => setAction(null)} variant="outline" className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmAction}
                                        disabled={reproveMutation.isPending}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        {reproveMutation.isPending ? "Processando..." : "Confirmar Reprovação"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Approve Form */}
                    {action === "approve" && (
                        <Card className="bg-green-500/10 border-green-500/30">
                            <CardContent className="p-4 space-y-4">
                                <h4 className="font-semibold text-green-200">Aprovar para Calculista</h4>

                                <div>
                                    <Label htmlFor="approve-notes">Observações (Opcional)</Label>
                                    <Textarea
                                        id="approve-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Adicione observações para o calculista..."
                                        className="bg-slate-900 border-slate-700 text-slate-100"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => setAction(null)} variant="outline" className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmAction}
                                        disabled={approveMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {approveMutation.isPending ? "Processando..." : "Confirmar Aprovação"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter>
                    {!action && (
                        <Button onClick={onClose} variant="outline">
                            Fechar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
