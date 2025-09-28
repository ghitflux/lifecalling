"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useClosingQueue, useClosingApprove, useClosingReject } from "@/lib/hooks";
import {
  Button,
  Badge,
  CardFechamento,
  QuickFilters,
  AdvancedFilters,
  FilterProvider,
  useFilters,
  type QuickFilter,
  type FilterGroup,
  type AdvancedFilterValue
} from "@lifecalling/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, User, Calendar, DollarSign, Building } from "lucide-react";

function FechamentoContent() {
  useLiveCaseEvents();
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useClosingQueue();
  const approve = useClosingApprove();
  const reject = useClosingReject();
  const {
    searchTerm,
    quickFilters,
    advancedFilters,
    setSearchTerm,
    toggleQuickFilter,
    setAdvancedFilters,
    clearAll,
    hasActiveFilters,
    getFilteredData
  } = useFilters();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Definir filtros rápidos disponíveis
  const availableQuickFilters: QuickFilter[] = [
    {
      id: "pendente",
      label: "Pendentes",
      value: "pendente",
      icon: User,
      color: "warning",
      count: items.filter((item: any) => item.status === "pendente").length
    },
    {
      id: "em_analise",
      label: "Em Análise",
      value: "em_analise",
      icon: Calendar,
      color: "primary",
      count: items.filter((item: any) => item.status === "em_analise").length
    },
    {
      id: "aprovado",
      label: "Aprovados",
      value: "aprovado",
      icon: DollarSign,
      color: "success",
      count: items.filter((item: any) => item.status === "aprovado").length
    }
  ];

  // Definir grupos de filtros avançados
  const advancedFilterGroups: FilterGroup[] = [
    {
      id: "status",
      label: "Status",
      type: "multiselect",
      icon: User,
      options: [...new Set(items.map((item: any) => item.status))].map((status) => ({
        id: status as string,
        label: status as string,
        value: status as string,
        count: items.filter((item: any) => item.status === status).length
      }))
    },
    {
      id: "banco",
      label: "Banco",
      type: "multiselect",
      icon: Building,
      options: [...new Set(items.map((item: any) => item.banco).filter(Boolean))].map((banco) => ({
        id: banco as string,
        label: banco as string,
        value: banco as string,
        count: items.filter((item: any) => item.banco === banco).length
      }))
    },
    {
      id: "data_criacao",
      label: "Data de Criação",
      type: "daterange",
      icon: Calendar
    },
    {
      id: "valor_total",
      label: "Valor Total",
      type: "numberrange",
      icon: DollarSign
    }
  ];

  // Função de filtro personalizada
  const filterFunction = (item: any, state: any) => {
    // Filtro de busca
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      const matchesSearch =
        item.client?.name?.toLowerCase().includes(searchLower) ||
        item.client?.cpf?.includes(state.searchTerm) ||
        item.id.toString().includes(state.searchTerm);

      if (!matchesSearch) return false;
    }

    // Filtros rápidos
    if (state.quickFilters.length > 0) {
      const matchesQuickFilter = state.quickFilters.some((filterId: string) => {
        const filter = availableQuickFilters.find(f => f.id === filterId);
        return filter && item.status === filter.value;
      });

      if (!matchesQuickFilter) return false;
    }

    // Filtros avançados
    for (const advancedFilter of state.advancedFilters) {
      const { groupId, values } = advancedFilter;

      if (values.length === 0) continue;

      switch (groupId) {
        case "status":
          if (!values.includes(item.status)) return false;
          break;
        case "banco":
          if (!values.includes(item.banco)) return false;
          break;
        case "data_criacao":
          if (values.length === 2) {
            const itemDate = new Date(item.created_at);
            const startDate = new Date(values[0]);
            const endDate = new Date(values[1]);
            if (itemDate < startDate || itemDate > endDate) return false;
          }
          break;
        // Adicionar mais casos conforme necessário
      }
    }

    return true;
  };

  // Aplicar filtros
  const filteredItems = getFilteredData(items, filterFunction);

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
            {hasActiveFilters ? ' (filtrados)' : ''}
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

      {/* New Filter System */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <QuickFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilters={quickFilters}
          onFilterToggle={toggleQuickFilter}
          availableFilters={availableQuickFilters}
          onClearAll={clearAll}
          onAdvancedFilters={() => setShowAdvancedFilters(true)}
          placeholder="Buscar por nome, CPF ou ID..."
        />
      </div>

      {/* Advanced Filters Dialog */}
      <AdvancedFilters
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
        filterGroups={advancedFilterGroups}
        values={advancedFilters}
        onValuesChange={setAdvancedFilters}
        onApply={() => {
          // Filtros são aplicados automaticamente via getFilteredData
        }}
        onClear={() => setAdvancedFilters([])}
      />

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
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAll}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item: any) => (
            <CardFechamento
              key={item.id}
              case={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              onViewDetails={() => router.push(`/fechamento/${item.id}`)}
              isLoading={approve.isPending && approve.variables === item.id || reject.isPending && reject.variables === item.id}
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

export default function Page() {
  return (
    <FilterProvider>
      <FechamentoContent />
    </FilterProvider>
  );
}
