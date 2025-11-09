"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@lifecalling/ui";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, User, FileText, Users, X, Building2, Activity, Target, CheckCircle, TrendingUp, Download } from "lucide-react";
import { KPICard } from "@lifecalling/ui";
import { ExportClientsDialog } from "@/components/ExportClientsDialog";

export default function Clientes() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [semContratos, setSemContratos] = useState<boolean>(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Query para filtros disponíveis
  const { data: filtersData } = useQuery({
    queryKey: ["/clients/filters"],
    queryFn: async () => {
      const response = await api.get("/clients/filters");
      return response.data;
    },
  });

  // Query para estatísticas/KPIs
  const { data: stats } = useQuery({
    queryKey: ["/clients/stats"],
    queryFn: async () => {
      const response = await api.get("/clients/stats");
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/clients", page, pageSize, searchTerm, selectedBanco, selectedStatus, semContratos],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (searchTerm) {
        params.append("q", searchTerm);
      }

      if (selectedBanco) {
        params.append("banco", selectedBanco);
      }

      if (selectedStatus) {
        params.append("status", selectedStatus);
      }

      if (semContratos) {
        params.append("sem_contratos", "true");
      }

      const response = await api.get(`/clients?${params.toString()}`);
      return response.data;
    },
  });

  const clients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Clientes importados do sistema de folha de pagamento
          </p>
        </div>
        <Button onClick={() => setExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Clientes"
          value={stats?.total_clients || 0}
          subtitle={`${stats?.new_clients || 0} novos (30 dias)`}
          icon={Users}
          color="primary"
        />
        <KPICard
          title="Casos Ativos"
          value={stats?.active_cases || 0}
          subtitle={`de ${stats?.total_cases || 0} casos`}
          icon={Target}
          color="warning"
        />
        <KPICard
          title="Casos Finalizados"
          value={stats?.completed_cases || 0}
          subtitle={`${stats?.conversion_rate || 0}% de conversão`}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Total de Contratos"
          value={stats?.total_contracts || 0}
          subtitle={`${stats?.clients_with_contracts || 0} clientes com contrato`}
          icon={Briefcase}
          color="info"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4 space-y-4">
        {/* Busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'cliente' : 'clientes'}
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="space-y-3">
          {/* Filtro por Banco */}
          {filtersData?.bancos && filtersData.bancos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Banco:</span>
                {selectedBanco && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBanco(null);
                      setPage(1);
                    }}
                    className="h-6 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filtersData.bancos.map((banco: any) => (
                  <Badge
                    key={banco.value}
                    variant={selectedBanco === banco.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setSelectedBanco(selectedBanco === banco.value ? null : banco.value);
                      setPage(1);
                    }}
                  >
                    {banco.label} ({banco.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por Status */}
          {filtersData?.status && filtersData.status.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status do Caso:</span>
                {selectedStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(null);
                      setPage(1);
                    }}
                    className="h-6 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filtersData.status.map((status: any) => (
                  <Badge
                    key={status.value}
                    variant={selectedStatus === status.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setSelectedStatus(selectedStatus === status.value ? null : status.value);
                      setPage(1);
                    }}
                  >
                    {status.label} ({status.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}


          {/* Filtro Sem Contratos */}
          {filtersData?.clientes_sem_contratos > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Outros Filtros:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={semContratos ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    setSemContratos(!semContratos);
                    setPage(1);
                  }}
                >
                  Sem Financiamentos ({filtersData.clientes_sem_contratos})
                </Badge>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente importado"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Importe um arquivo de folha de pagamento para ver os clientes aqui"}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/importacao">
                <FileText className="h-4 w-4 mr-2" />
                Importar Dados
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {clients.map((client: any) => (
              <Card key={client.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{client.nome}</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {client.contratos} contrato{client.contratos !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">CPF:</span> {formatCPF(client.cpf)}
                      </div>
                      <div>
                        <span className="font-medium">Matrícula:</span> {client.matricula}
                      </div>
                      <div>
                        <span className="font-medium">Órgão:</span> {client.orgao || "—"}
                      </div>
                    </div>

                    {client.created_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Importado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button asChild>
                      <Link href={`/clientes/${client.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              onItemsPerPageChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemsPerPageOptions={[20, 50, 100]}
            />
          )}
        </>
      )}

      {/* Export Dialog */}
      <ExportClientsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        filters={{
          searchTerm,
          selectedBanco,
          selectedStatus,
          selectedOrgao,
          semContratos,
        }}
      />
    </div>
  );
}