"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { mobileApi, type AdminClient } from "@/services/mobileApi";

// Modal para visualizar simulações do cliente
function ClientSimulationsModal({ client }: { client: AdminClient }) {
    const { data: simulations, isLoading } = useQuery({
        queryKey: ["clientSimulations", client.id],
        queryFn: async () => {
            const allSims = await mobileApi.getAdminSimulations();
            return allSims.filter(sim => sim.user_email === client.email);
        }
    });

    return (
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Simulações de {client.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Carregando...</p>
                ) : simulations?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhuma simulação encontrada</p>
                ) : (
                    simulations?.map((sim) => (
                        <Card key={sim.id} className="border-l-4" style={{
                            borderLeftColor:
                                sim.status === 'approved' ? '#10b981' :
                                    sim.status === 'rejected' ? '#ef4444' :
                                        '#f59e0b'
                        }}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Simulação #{sim.id}</h4>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {sim.type?.replace(/_/g, ' ') || sim.simulation_type?.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={sim.status === 'rejected' ? 'destructive' : 'outline'}
                                        className={
                                            sim.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                sim.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                                        }
                                    >
                                        {sim.status === 'pending' ? 'Pendente' :
                                            sim.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-500">Valor</p>
                                        <p className="font-medium">R$ {(sim.amount || sim.requested_amount)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                                {sim.document_filename && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                        <Paperclip size={14} />
                                        <span>{sim.document_filename}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </DialogContent>
    );
}

export default function LifeMobileClientsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: clients, isLoading } = useQuery({
        queryKey: ["adminClients"],
        queryFn: mobileApi.getAdminClients,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const filteredClients = clients?.filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf?.includes(searchTerm)
    ) || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes Mobile</h1>
                    <p className="text-gray-500">Gerencie os usuários do aplicativo mobile</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Lista de Clientes</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por nome, email ou CPF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Carregando clientes...</div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum cliente encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CPF
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            WhatsApp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cadastro
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-full">
                                                        <User size={18} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{client.name}</p>
                                                        <p className="text-sm text-gray-500">{client.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm text-gray-700">
                                                    {client.cpf || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {client.phone ? (
                                                    <a
                                                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                                                    >
                                                        <Phone size={16} />
                                                        <span>{client.phone}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(client.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            Ver Simulações
                                                        </Button>
                                                    </DialogTrigger>
                                                    <ClientSimulationsModal client={client} />
                                                </Dialog>
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
