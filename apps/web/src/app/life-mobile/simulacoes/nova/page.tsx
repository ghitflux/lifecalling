"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, SimpleSelect } from "@lifecalling/ui";
import { mobileApi, AdminClient } from "@/services/mobileApi";
import { toast } from "sonner";
import { SimulationFormMultiBank } from "@/components/mobile/SimulationFormMultiBank";

export default function NewSimulationPage() {
    const router = useRouter();
    const [selectedClient, setSelectedClient] = useState("");

    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ["adminClients"],
        queryFn: mobileApi.getAdminClients,
    });

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
        onSuccess: () => {
            toast.success("Simulação salva com sucesso!");
            router.push("/life-mobile/simulacoes");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.message || "Erro ao salvar simulação");
        }
    });

    const handleCalculate = (data: any) => {
        createSimulationMutation.mutate(data);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nova Simulação</h1>
                    <p className="text-gray-500">Criar nova simulação multi-bancos para cliente mobile</p>
                </div>
            </div>

            <div className="max-w-5xl">
                {/* Seleção de Cliente */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Selecione o Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cliente Mobile *</label>
                            {clientsLoading ? (
                                <div className="h-10 bg-gray-100 animate-pulse rounded" />
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
                                <p className="text-xs text-muted-foreground">
                                    Selecione um cliente antes de preencher a simulação
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Formulário de Simulação */}
                {selectedClient ? (
                    <SimulationFormMultiBank
                        onCalculate={handleCalculate}
                        loading={createSimulationMutation.isPending}
                    />
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Selecione um cliente para iniciar a simulação</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
