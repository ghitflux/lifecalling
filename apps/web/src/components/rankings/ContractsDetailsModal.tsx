"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Badge, Card, Button, StatusBadge } from "@lifecalling/ui";
import { RankingTable } from "@lifecalling/ui";
import { FileText, TrendingUp, DollarSign, User, FolderOpen } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDateBR } from "@/lib/timezone";

interface ContractsDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  startDate: string;
  endDate: string;
  embedded?: boolean; // Se true, renderiza sem Dialog (para embedded na página)
}

export function ContractsDetailsModal({
  open,
  onOpenChange,
  userId,
  userName,
  startDate,
  endDate,
  embedded = false
}: ContractsDetailsModalProps) {
  // Query para buscar contratos do usuário
  const { data, isLoading, error } = useQuery({
    queryKey: ["rankings", "contracts", userId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("from", new Date(startDate).toISOString());
      params.append("to", new Date(endDate).toISOString());
      const response = await api.get(`/rankings/agents/${userId}/contracts?${params.toString()}`);
      return response.data;
    },
    enabled: open || embedded // Só busca se modal estiver aberto ou for embedded
  });

  // Formatar CPF
  const formatCPF = (cpf: string) => {
    if (!cpf) return "—";
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  // Formatar data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const formatted = formatDateBR(dateStr);
    return formatted || "—";
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Router para navegação
  const router = useRouter();

  // Colunas da tabela
  const columns = useMemo(() => [
    {
      key: "client_name",
      header: "Cliente"
    },
    {
      key: "client_cpf",
      header: "CPF",
      render: (row: any) => <span className="font-mono text-sm">{formatCPF(row.client_cpf)}</span>
    },
    {
      key: "signed_at",
      header: "Data Efetivação",
      render: (row: any) => <span className="text-sm">{formatDate(row.signed_at)}</span>
    },
    {
      key: "consultoria_valor_liquido",
      header: "Consultoria Líq.",
      format: "currency" as const
    },
    {
      key: "total_amount",
      header: "Total Financiado",
      format: "currency" as const
    },
    {
      key: "case_status",
      header: "Status do Caso",
      render: (row: any) => {
        // Usar o status do caso (case_status) ao invés do status do contrato
        return <StatusBadge status={row.case_status || "encerrado"} size="sm" />;
      }
    },
    {
      key: "actions",
      header: "Ações",
      render: (row: any) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/clientes/${row.client_id}`)}
            className="h-7 px-2 text-xs"
          >
            <User className="h-3 w-3 mr-1" />
            Cliente
          </Button>
        </div>
      )
    }
  ], [router]);

  // Conteúdo da modal
  const content = (
    <div className="space-y-6">
      {/* Totalizadores */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contratos</p>
                <p className="text-2xl font-bold">{data.summary.total_contracts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consultoria Total</p>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.total_consultoria)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.ticket_medio)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabela de contratos */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-destructive">Erro ao carregar contratos</p>
          <p className="text-sm text-muted-foreground mt-1">
            {(error as any)?.response?.data?.detail || "Tente novamente mais tarde"}
          </p>
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <RankingTable
          data={data.items}
          columns={columns}
          showPagination={true}
          defaultItemsPerPage={10}
        />
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum contrato encontrado para o período selecionado</p>
        </div>
      )}
    </div>
  );

  // Se for embedded, renderiza direto sem Dialog
  if (embedded) {
    return content;
  }

  // Renderizar com Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Contratos de {userName}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
