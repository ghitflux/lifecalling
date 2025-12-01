"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Snippet } from "@nextui-org/snippet";
import {
    User,
    Phone,
    FileText,
    Eye,
    Paperclip,
    Search
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Badge,
    Input
} from "@lifecalling/ui";
import { mobileApi, type AdminClient, type AdminSimulation } from "@/services/mobileApi";

const copyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
);

// Modal para visualizar simulações do cliente
function ClientSimulationsModal({ client }: { client: AdminClient }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const cachedSimulations = queryClient.getQueryData<AdminSimulation[]>(["adminSimulations"]);

    const { data: simulations, isLoading } = useQuery({
        queryKey: ["clientSimulations", client.id],
        queryFn: async () => {
            const allSims = await mobileApi.getAdminSimulations();
            return allSims.filter(sim => sim.user_email === client.email);
        },
        initialData: () => cachedSimulations?.filter(sim => sim.user_email === client.email),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: "always",
        refetchInterval: 15000
    });

    return (
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 text-slate-100 border border-slate-800">
            <DialogHeader>
                <DialogTitle>Simulações de {client.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-8">Carregando...</p>
                ) : simulations?.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhuma simulação encontrada</p>
                ) : (
                    simulations?.map((sim) => (
                        <Card
                            key={sim.id}
                            className="border-l-4 bg-slate-900/80 border-slate-800"
                            style={{
                                borderLeftColor:
                                    sim.status === 'approved' ? '#10b981' :
                                        sim.status === 'rejected' ? '#ef4444' :
                                            '#f59e0b'
                            }}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-100">Simulação #{sim.id}</h4>
                                        <p className="text-sm text-slate-400 capitalize">
                                            {sim.type?.replace(/_/g, ' ') || sim.simulation_type?.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={sim.status === 'rejected' ? 'destructive' : 'outline'}
                                        className={
                                            sim.status === 'approved' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40' :
                                                sim.status === 'pending' ? 'bg-amber-500/15 text-amber-200 border-amber-500/40' : ''
                                        }
                                    >
                                        {sim.status === 'pending' ? 'Pendente' :
                                            sim.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <p className="text-slate-400">Valor</p>
                                        <p className="font-medium text-slate-100">R$ {(sim.amount || sim.requested_amount)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Parcelas</p>
                                        <p className="font-medium text-slate-100">{sim.installments}x</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Data</p>
                                        <p className="font-medium text-slate-100">{new Date(sim.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                {sim.document_filename && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-indigo-200">
                                        <Paperclip size={14} />
                                        <span>{sim.document_filename}</span>
                                    </div>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => router.push(`/life-mobile/simulacoes/${sim.id}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver Detalhes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </DialogContent>
    );
}

function ClientDetailsModal({ client }: { client: AdminClient }) {
    const queryClient = useQueryClient();
    const cachedSimulations = queryClient.getQueryData<AdminSimulation[]>(["adminSimulations"]);
    const simulations: AdminSimulation[] = (cachedSimulations || []).filter(sim => sim.user_email === client.email);
    const simulationsSorted = [...simulations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const contratosEfetivados = simulationsSorted.filter(sim => (sim.status || "").toLowerCase() === "contrato_efetivado");

    const formattedCreatedAt = client.created_at ? new Date(client.created_at).toLocaleDateString("pt-BR") : "-";

    return (
        <DialogContent className="max-w-xl bg-slate-900 text-slate-100 border border-slate-800">
            <DialogHeader>
                <DialogTitle>Dados do Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-slate-400">Nome</p>
                    <p className="font-semibold">{client.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="font-semibold break-all">{client.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Cadastro</p>
                        <p className="font-semibold">{formattedCreatedAt}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">CPF</p>
                        <Snippet
                            symbol=""
                            classNames={{ base: "bg-muted text-slate-100 border border-slate-800 rounded-md", pre: "font-mono text-xs" }}
                            style={{ borderRadius: "var(--radius)" }}
                            copyIcon={copyIcon}
                            onCopy={() => navigator.clipboard.writeText((client.cpf || "").replace(/\D/g, ""))}
                        >
                            {client.cpf || "-"}
                        </Snippet>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 mb-1">WhatsApp</p>
                        <Snippet
                            symbol=""
                            classNames={{ base: "bg-muted text-slate-100 border border-slate-800 rounded-md", pre: "font-mono text-xs" }}
                            style={{ borderRadius: "var(--radius)" }}
                            copyIcon={copyIcon}
                            onCopy={() => navigator.clipboard.writeText((client.phone || "").replace(/\D/g, ""))}
                        >
                            {client.phone || "-"}
                        </Snippet>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-3">
                    <p className="text-sm text-slate-400 mb-2">Histórico de Simulações</p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {simulationsSorted.length === 0 && (
                            <p className="text-slate-500 text-sm">Nenhuma simulação encontrada.</p>
                        )}
                        {simulationsSorted.map(sim => (
                            <div
                                key={sim.id}
                                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-semibold text-slate-100">{(sim.type || sim.simulation_type || '').replace(/_/g, ' ') || 'Simulação'}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(sim.created_at).toLocaleString('pt-BR')} • {sim.status}
                                    </p>
                                </div>
                                <p className="font-semibold text-emerald-200">{sim.amount ? `R$ ${sim.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-3">
                    <p className="text-sm text-slate-400 mb-2">Contratos Efetivados</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {contratosEfetivados.length === 0 && (
                            <p className="text-slate-500 text-sm">Nenhum contrato efetivado.</p>
                        )}
                        {contratosEfetivados.map(sim => (
                            <div
                                key={sim.id}
                                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-semibold text-slate-100">{(sim.type || sim.simulation_type || '').replace(/_/g, ' ') || 'Contrato Mobile'}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(sim.created_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <p className="font-semibold text-emerald-200">{sim.amount ? `R$ ${sim.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}

export default function LifeMobileClientsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const { data: clients, isLoading } = useQuery({
        queryKey: ["adminClients"],
        queryFn: mobileApi.getAdminClients,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: "always",
        refetchInterval: 15000
    });

    const { data: simulations } = useQuery({
        queryKey: ["adminSimulations"],
        queryFn: mobileApi.getAdminSimulations,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: "always",
        refetchInterval: 15000
    });

    const filteredClients = clients?.filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf?.includes(searchTerm)
    ) || [];

    const formatWhatsApp = (phone?: string) => {
        if (!phone) return "-";
        const digits = phone.replace(/\D/g, "");
        if (digits.length >= 10) {
            return `(${digits.slice(-11, -9)}) ${digits.slice(-9, -4)}-${digits.slice(-4)}`;
        }
        return phone;
    };

    const simulationByEmail = useMemo(() => {
        if (!simulations) return {};
        const grouped: Record<string, AdminSimulation[]> = {};
        simulations.forEach((sim) => {
            if (!sim.user_email) return;
            grouped[sim.user_email] = grouped[sim.user_email] || [];
            grouped[sim.user_email].push(sim);
        });
        return grouped;
    }, [simulations]);

    const hasRequestedSimulation = (client: AdminClient) => {
        const sims = simulationByEmail[client.email] || [];
        return sims.some((sim) => {
            const status = (sim.status || "").toLowerCase();
            return status === "simulacao_solicitada" || status === "simulation_requested" || status === "pending";
        });
    };

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Clientes Mobile</h1>
                    <p className="text-slate-400">Gerencie os usuários do aplicativo mobile</p>
                </div>
            </div>

            <Card className="border border-slate-800/60 bg-slate-900/70 shadow-lg shadow-black/40">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-slate-100">Lista de Clientes</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome, email ou CPF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-700"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Carregando clientes...</div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum cliente encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                            <table className="w-full">
                                <thead className="bg-slate-900/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            CPF
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            WhatsApp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Cadastro
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-900/40 divide-y divide-slate-800">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-900 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
                                                        <User size={18} className="text-slate-200" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-100">{client.name}</p>
                                                        <p className="text-sm text-slate-400">{client.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Snippet
                                                    symbol=""
                                                    classNames={{ base: "bg-muted border border-slate-800 text-slate-100 rounded-md", pre: "font-mono text-xs" }}
                                                    style={{ borderRadius: "var(--radius)" }}
                                                    copyIcon={copyIcon}
                                                    onCopy={() => navigator.clipboard.writeText((client.cpf || "").replace(/\D/g, ""))}
                                                >
                                                    {client.cpf || "-"}
                                                </Snippet>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Snippet
                                                    symbol=""
                                                    classNames={{ base: "bg-muted border border-slate-800 text-slate-100 rounded-md", pre: "font-mono text-xs flex items-center gap-2" }}
                                                    style={{ borderRadius: "var(--radius)" }}
                                                    copyIcon={copyIcon}
                                                    onCopy={() => navigator.clipboard.writeText((client.phone || "").replace(/\D/g, ""))}
                                                >
                                                    {client.phone ? formatWhatsApp(client.phone) : "-"}
                                                </Snippet>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {new Date(client.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-100 hover:bg-slate-800">
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            Ver Simulações
                                                        </Button>
                                                    </DialogTrigger>
                                                    <ClientSimulationsModal client={client} />
                                                </Dialog>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="ml-2 border-slate-700 text-slate-100 hover:bg-slate-800"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Detalhes
                                                        </Button>
                                                    </DialogTrigger>
                                                    <ClientDetailsModal client={client} />
                                                </Dialog>
                                                {hasRequestedSimulation(client) && (
                                                    <Button
                                                        size="sm"
                                                        className="ml-2 bg-indigo-600 hover:bg-indigo-700"
                                                        onClick={() => router.push(`/life-mobile/simulacoes/nova?clientId=${client.id}`)}
                                                    >
                                                        <Search className="h-4 w-4 mr-1" />
                                                        Simular
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
