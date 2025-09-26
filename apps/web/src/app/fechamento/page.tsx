"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useClosingQueue, useClosingApprove, useClosingReject } from "@/lib/hooks";
import { ClosingCard, Button, Badge } from "@lifecalling/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, RefreshCw } from "lucide-react";

export default function Page(){
  useLiveCaseEvents();
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useClosingQueue();
  const approve = useClosingApprove();
  const reject = useClosingReject();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtrar itens baseado na busca e filtro de status
  const filteredItems = items.filter((item: any) => {
    const matchesSearch = !searchTerm ||
      item.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client?.cpf?.includes(searchTerm) ||
      item.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status únicos para filtro
  const uniqueStatuses = [...new Set(items.map((item: any) => item.status))];

  const handleApprove = (caseId: number) => {
    approve.mutate(caseId);
  };

  const handleReject = (caseId: number) => {
    reject.mutate(caseId);
  };

  const handleViewDetails = (caseId: number) => {
    router.push(`/casos/${caseId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fechamento</h1>
          <p className="text-muted-foreground">
            Aprovação e revisão de casos prontos para fechamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredItems.length} caso{filteredItems.length !== 1 ? 's' : ''}
            {searchTerm || statusFilter !== "all" ? ' (filtrados)' : ''}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Todos os status</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-8">
          <div className="text-destructive mb-2">Erro ao carregar casos</div>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            {items.length === 0
              ? "Nenhum caso pendente para fechamento"
              : "Nenhum caso encontrado com os filtros aplicados"
            }
          </div>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item: any) => (
            <ClosingCard
              key={item.id}
              case={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
              isLoading={approve.isPending || reject.isPending}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Mostrando {filteredItems.length} de {items.length} casos
        </div>
      )}
    </div>
  );
}
