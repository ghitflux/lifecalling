"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import {
  useFinanceQueue,
  useFinanceDisburseSimple,
  useUploadContractAttachment,
  useCancelContract,
  useDeleteContract,
  useFinanceCaseDetails
} from "@/lib/hooks";
import { FinanceCard, ExpenseModal, IncomeModal, Button, Tabs, TabsList, TabsTrigger, TabsContent, Card, QuickFilters, Pagination, KPICard } from "@lifecalling/ui";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Download, Plus, TrendingUp, Wallet, Trash2, Edit, TrendingDown, Receipt, Target, Eye, FileText, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page(){
  useLiveCaseEvents();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: items = [], isLoading: loadingQueue } = useFinanceQueue();
  const disb = useFinanceDisburseSimple();
  const cancelContract = useCancelContract();
  const deleteContract = useDeleteContract();
  const uploadAttachment = useUploadContractAttachment();
  const [uploadingContractId, setUploadingContractId] = useState<number | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  // Filtros para transaÃ§Ãµes
  const [transactionType, setTransactionType] = useState<string>("");  // "", "receita", "despesa"
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal de detalhes do contrato
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // Filtros rÃ¡pidos
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // PaginaÃ§Ã£o
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detalhes completos do caso
  const { data: fullCaseDetails } = useFinanceCaseDetails(selectedCaseId || 0);

  // Buscar transaÃ§Ãµes unificadas (receitas e despesas)
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions", startDate, endDate, transactionType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (transactionType) params.append("transaction_type", transactionType);

      const response = await api.get(`/finance/transactions?${params.toString()}`);
      return response.data;
    }
  });

  const transactions = transactionsData?.items || [];
  const totals = transactionsData?.totals || { receitas: 0, despesas: 0, saldo: 0 };

  // Buscar mÃ©tricas do financeiro
  const { data: metricsData } = useQuery({
    queryKey: ["financeMetrics"],
    queryFn: async () => {
      const response = await api.get("/finance/metrics");
      return response.data;
    }
  });

  const metrics = metricsData || {};

  // Buscar detalhes do contrato
  const { data: contractDetails, isLoading: loadingContractDetails } = useQuery({
    queryKey: ["contract", selectedContractId],
    queryFn: async () => {
      if (!selectedContractId) return null;
      const response = await api.get(`/finance/contracts/${selectedContractId}`);
      return response.data;
    },
    enabled: !!selectedContractId});

  // Mutation para salvar despesa
  const saveExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingExpense) {
        const response = await api.put(`/finance/expenses/${editingExpense.id}`, data);
        return response.data;
      } else {
        const response = await api.post("/finance/expenses", data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingExpense ? "Despesa atualizada!" : "Despesa adicionada!");
      setShowExpenseModal(false);
      setEditingExpense(null);
    },
    onError: (error: any) => {
      console.error('Erro ao salvar despesa:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar despesa");
    }
  });

  // Mutation para deletar despesa
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Despesa excluÃ­da!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir despesa");
    }
  });

  // Mutation para salvar receita
  const saveIncomeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingIncome) {
        const response = await api.put(`/finance/incomes/${editingIncome.id}`, data);
        return response.data;
      } else {
        const response = await api.post("/finance/incomes", data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingIncome ? "Receita atualizada!" : "Receita adicionada!");
      setShowIncomeModal(false);
      setEditingIncome(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao salvar receita");
    }
  });

  // Mutation para deletar receita
  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Receita excluÃ­da!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir receita");
    }
  });

  const handleDisburse = async (id: number) => {
    try {
      await disb.mutateAsync(id);
      toast.success("LiberaÃ§Ã£o efetivada com sucesso!");
    } catch (error) {
      console.error('Erro ao efetivar:', error);
      toast.error("Erro ao efetivar liberaÃ§Ã£o. Tente novamente.");
    }
  };

  const handleCancel = async (contractId: number) => {
    try {
      await cancelContract.mutateAsync(contractId);
      toast.success("OperaÃ§Ã£o cancelada com sucesso!");
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error("Erro ao cancelar operaÃ§Ã£o. Tente novamente.");
    }
  };

  const handleDelete = async (contractId: number) => {
    try {
      await deleteContract.mutateAsync(contractId);
      toast.success("OperaÃ§Ã£o deletada com sucesso!");
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error("Erro ao deletar operaÃ§Ã£o. Tente novamente.");
    }
  };

  const handleReturnToCalc = async (caseId: number) => {
    try {
      // Retornar o caso para o status de calculista
      await api.post(`/cases/${caseId}/return-to-calculista`);
      toast.success("Caso retornado ao calculista com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
    } catch (error) {
      console.error('Erro ao retornar ao calculista:', error);
      toast.error("Erro ao retornar caso ao calculista. Tente novamente.");
    }
  };

  const handleDeleteCase = async (caseId: number) => {
    try {
      await api.delete(`/cases/${caseId}`);
      toast.success("Caso deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
    } catch (error) {
      console.error('Erro ao deletar caso:', error);
      toast.error("Erro ao deletar caso. Tente novamente.");
    }
  };

  const createUploadHandler = (contractId: number | null, caseId: number) => async (file: File) => {
    setUploadingContractId(contractId);
    try {
      if (contractId) {
        await uploadAttachment.mutateAsync({ contractId, file });
      } else {
        // Upload para caso sem contrato ainda
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/cases/${caseId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
      }
      toast.success("Comprovante anexado com sucesso!");
    } catch (error) {
      console.error('Erro ao anexar comprovante:', error);
      toast.error("Erro ao anexar comprovante. Tente novamente.");
    } finally {
      setUploadingContractId(null);
    }
  };

  const handleLoadFullDetails = (caseId: number) => {
    setSelectedCaseId(caseId);
  };

  const handleEditTransaction = (transaction: any) => {
    // Extrair o ID real do formato "receita-{id}" ou "despesa-{id}"
    const realId = parseInt(transaction.id.split('-')[1]);

    if (transaction.type === "receita") {
      // Buscar detalhes completos da receita
      api.get(`/finance/incomes/${realId}`).then(res => {
        setEditingIncome(res.data);
        setShowIncomeModal(true);
      });
    } else {
      // Buscar detalhes completos da despesa
      api.get(`/finance/expenses/${realId}`).then(res => {
        setEditingExpense(res.data);
        setShowExpenseModal(true);
      });
    }
  };

  const handleDeleteTransaction = async (transaction: any) => {
    const realId = parseInt(transaction.id.split('-')[1]);
    const confirmMessage = transaction.type === "receita"
      ? "Deseja realmente excluir esta receita?"
      : "Deseja realmente excluir esta despesa?";

    if (confirm(confirmMessage)) {
      if (transaction.type === "receita") {
        await deleteIncomeMutation.mutateAsync(realId);
      } else {
        await deleteExpenseMutation.mutateAsync(realId);
      }
    }
  };

  const extractContractIdFromName = (name: string): number | null => {
    // Formato: "Contrato #{id} - ..."
    const match = name?.match(/Contrato #(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const handleViewContractDetails = (transaction: any) => {
    const contractId = extractContractIdFromName(transaction.name);
    if (contractId) {
      setSelectedContractId(contractId);
      setShowContractModal(true);
    }
  };

  const handleExportReport = () => {
    window.open(`${api.defaults.baseURL}/finance/export`, '_blank');
  };

  // Filtros rÃ¡pidos de status
  const statusCounts = {
    aprovado: items.filter((i: any) => !i.contract && ["fechamento_aprovado", "financeiro_pendente"].includes(i.status)).length,
    liberado: items.filter((i: any) => !!i.contract).length,
    devolvido: items.filter((i: any) => i.status === "devolvido_financeiro").length,
    cancelado: items.filter((i: any) => i.status === "contrato_cancelado").length,
    todos: items.length
  };

  const availableFilters = [
    { id: "aprovado", label: "Aprovado", value: "aprovado", color: "success" as const, count: statusCounts.aprovado },
    { id: "liberado", label: "Liberado", value: "liberado", color: "primary" as const, count: statusCounts.liberado },
    { id: "devolvido", label: "Devolvido", value: "devolvido", color: "warning" as const, count: statusCounts.devolvido },
    { id: "cancelado", label: "Cancelado", value: "cancelado", color: "danger" as const, count: statusCounts.cancelado },
    { id: "todos", label: "Todos", value: "todos", color: "secondary" as const, count: statusCounts.todos }
  ];

  const handleFilterToggle = (filterId: string) => {
    setStatusFilter(prev => (prev.includes(filterId) ? [] : [filterId]));
    setPage(1); // Reset para primeira pÃ¡gina ao filtrar
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setSearchTerm("");
    setPage(1);
  };

  // Filtrar items
  const filteredItems = items.filter((item: any) => {
    // Filtro de busca
    if (searchTerm) {
      const clientName = item.client?.name?.toLowerCase() || "";
      const clientCpf = item.client?.cpf || "";
      const search = searchTerm.toLowerCase();
      if (!clientName.includes(search) && !clientCpf.includes(search)) {
        return false;
      }
    }

    // Filtro de status
    if (statusFilter.length > 0) {
      const active = statusFilter[0];
      switch (active) {
        case "aprovado":
          if (!( !item.contract && ["fechamento_aprovado", "financeiro_pendente"].includes(item.status) )) {
            return false;
          }
          break;
        case "liberado":
          if (!item.contract) return false;
          break;
        case "devolvido":
          if (item.status !== "devolvido_financeiro") return false;
          break;
        case "cancelado":
          if (item.status !== "contrato_cancelado") return false;
          break;
        case "todos":
          break;
        default:
          break;
      }
    }

    return true;
  });

  // Calcular paginaÃ§Ã£o
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GestÃ£o Financeira</h1>
          <p className="text-muted-foreground mt-1">VisÃ£o geral das operaÃ§Ãµes financeiras</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar RelatÃ³rio
          </Button>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={`R$ ${(metrics.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
          subtitle="Ãšltimos 30 dias"
        />
        <KPICard
          title="Despesas"
          value={`R$ ${(metrics.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          trend={{ value: 8.2, isPositive: false }}
          subtitle="Ãšltimos 30 dias"
        />
        <KPICard
          title="Lucro LÃ­quido"
          value={`R$ ${(metrics.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={{ value: 15.3, isPositive: true }}
          subtitle="Receitas - Despesas - Impostos"
        />
        <KPICard
          title="Contratos Efetivados"
          value={metrics.totalContracts || 0}
          icon={Receipt}
          trend={{ value: 5, isPositive: true }}
          subtitle="Total geral"
        />
      </div>

      {/* Filtros RÃ¡pidos */}
      <QuickFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1); // Reset para primeira pÃ¡gina ao buscar
        }}
        activeFilters={statusFilter}
        onFilterToggle={handleFilterToggle}
        availableFilters={availableFilters}
        onClearAll={handleClearFilters}
        placeholder="Buscar por nome ou CPF..."
      />

      {/* Lista de Casos Financeiros */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Atendimentos para LiberaÃ§Ã£o</h2>

        {loadingQueue ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando atendimentos...</p>
          </div>
        ) : totalItems > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {paginatedItems.map((item: any) => {
              const contractId = item.contract?.id;
              const clientBankInfo = item.client ? {
                banco: item.client.banco,
                agencia: item.client.agencia,
                conta: item.client.conta,
                chave_pix: item.client.chave_pix,
                tipo_chave_pix: item.client.tipo_chave_pix
              } : undefined;

              // Extrair valores da simulaÃ§Ã£o
              const simulationResult = item.simulation ? {
                banco: item.simulation.banks?.[0]?.banco || "",
                valorLiberado: item.simulation.totals.liberadoTotal,
                valorParcela: item.simulation.totals.valorParcelaTotal,
                coeficiente: parseFloat(item.simulation.coeficiente || "0"),
                saldoDevedor: item.simulation.totals.saldoTotal,
                valorTotalFinanciado: item.simulation.totals.totalFinanciado,
                seguroObrigatorio: item.simulation.totals.seguroObrigatorio || 0,
                valorLiquido: item.simulation.totals.valorLiquido,
                custoConsultoria: item.simulation.totals.custoConsultoria,
                custoConsultoriaLiquido: item.simulation.totals.custoConsultoriaLiquido || (item.simulation.totals.custoConsultoria * 0.86),
                liberadoCliente: item.simulation.totals.liberadoCliente,
                percentualConsultoria: item.simulation.percentualConsultoria,
                taxaJuros: 1.99, // Mock - adicionar no backend se necessÃ¡rio
                prazo: item.simulation.prazo
              } : undefined;

              return (
                <FinanceCard
                  key={item.id}
                  id={item.id}
                  clientName={item.client?.name || `Cliente ${item.id}`}
                  totalAmount={item.contract?.total_amount || item.simulation?.totals.liberadoTotal || 0}
                  installments={item.contract?.installments || item.simulation?.prazo || 0}
                  status={item.contract ? "disbursed" : "approved"}
                  dueDate={new Date(Date.now() + 30*24*60*60*1000).toISOString()}
                  simulationResult={simulationResult}
                  onDisburse={handleDisburse}
                  onCancel={contractId ? () => handleCancel(contractId) : undefined}
                  onDelete={contractId ? () => handleDelete(contractId) : () => handleDeleteCase(item.id)}
                  onReturnToCalc={!contractId ? handleReturnToCalc : undefined}
                  clientBankInfo={clientBankInfo}
                  attachments={item.contract?.attachments || item.attachments || []}
                  onUploadAttachment={createUploadHandler(contractId, item.id)}
                  isUploadingAttachment={uploadingContractId === contractId}
                  caseDetails={{
                    cpf: item.client?.cpf,
                    matricula: item.client?.matricula,
                    created_at: item.created_at
                  }}
                  fullCaseDetails={selectedCaseId === item.id ? fullCaseDetails : undefined}
                  onLoadFullDetails={handleLoadFullDetails}
                />
              );
            })}
          </div>

          {/* PaginaÃ§Ã£o */}
          {totalItems > pageSize && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              onItemsPerPageChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemsPerPageOptions={[10, 20, 50]}
            />
          )}
        </>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <p className="text-lg text-muted-foreground">âœ¨ Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter.length > 0 || searchTerm ? "Tente ajustar os filtros" : "Todos os atendimentos financeiros foram processados."}
            </p>
          </Card>
        )}
      </div>

      {/* GestÃ£o de Receitas e Despesas */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Receitas e Despesas</h3>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setEditingIncome(null);
                  setShowIncomeModal(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Receita
              </Button>
              <Button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Despesa
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          {/* Abas de Tipos de TransaÃ§Ã£o */}
          <Tabs value={transactionType || "todas"} onValueChange={(v) => setTransactionType(v === "todas" ? "" : v)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="receita">Receitas</TabsTrigger>
              <TabsTrigger value="despesa">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tabela Unificada */}
          {loadingTransactions ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando transaÃ§Ãµes...</p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Data</th>
                        <th className="text-left p-3 font-semibold">Tipo</th>
                        <th className="text-left p-3 font-semibold">Categoria</th>
                        <th className="text-left p-3 font-semibold">Nome</th>
                        <th className="text-right p-3 font-semibold">Valor</th>
                        <th className="text-right p-3 font-semibold">AÃ§Ãµes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction: any) => (
                        <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${
                              transaction.type === 'receita'
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="p-3">{transaction.category}</td>
                          <td className="p-3">{transaction.name || '-'}</td>
                          <td className={`p-3 text-right font-semibold ${
                            transaction.type === 'receita' ? 'text-success' : 'text-danger'
                          }`}>
                            R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {transaction.type === 'receita' && extractContractIdFromName(transaction.name) && (
                              <Button size="sm" variant="outline" onClick={() => handleViewContractDetails(transaction)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleEditTransaction(transaction)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTransaction(transaction)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* Linhas de totais */}
                      <tr className="bg-muted/20 border-t-2">
                        <td colSpan={4} className="p-3 text-right font-bold">Total Receitas</td>
                        <td className="p-3 text-right font-bold text-success text-lg">
                          R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td colSpan={4} className="p-3 text-right font-bold">Total Despesas</td>
                        <td className="p-3 text-right font-bold text-danger text-lg">
                          R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-muted/30 border-t-2">
                        <td colSpan={4} className="p-3 text-right font-bold">Saldo</td>
                        <td className={`p-3 text-right font-bold text-lg ${
                          totals.saldo >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
              <p>Nenhuma transaÃ§Ã£o encontrada</p>
              <p className="text-sm mt-1">Adicione receitas ou despesas para comeÃ§ar</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Despesas */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSubmit={(data) => saveExpenseMutation.mutate(data)}
        initialData={editingExpense}
        loading={saveExpenseMutation.isPending}
      />

      {/* Modal de Receitas */}
      <IncomeModal
        isOpen={showIncomeModal}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSubmit={(data) => saveIncomeMutation.mutate(data)}
        initialData={editingIncome}
        loading={saveIncomeMutation.isPending}
      />

      {/* Modal de Detalhes do Contrato */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowContractModal(false)}>
          <div className="bg-card border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{loadingContractDetails || !contractDetails ? "Carregando contrato..." : `Detalhes do Contrato #${contractDetails.id}`}</h2>
                  {contractDetails && (<p className="text-muted-foreground mt-1">Atendimento #{contractDetails.case_id}</p>)}
                </div>
                {loadingContractDetails || !contractDetails ? (
                  <div className="py-12 text-center text-muted-foreground">Carregando contrato...</div>
                ) : (
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Loading State */}
              {loadingContractDetails || !contractDetails ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>Carregando detalhes do contrato...</p>
                </div>
              ) : (
                <>
                  {/* Cliente */}
                  {contractDetails.client && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{contractDetails.client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{contractDetails.client.cpf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MatrÃ­cula</p>
                      <p className="font-medium">{contractDetails.client.matricula}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ã“rgÃ£o</p>
                      <p className="font-medium">{contractDetails.client.orgao || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financeiro */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dados Financeiros
                </h3>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg">R$ {contractDetails.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consultoria LÃ­quida</p>
                    <p className="font-bold text-lg text-success">R$ {contractDetails.consultoria_valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parcelas</p>
                    <p className="font-medium">{contractDetails.paid_installments}/{contractDetails.installments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-md bg-primary/10 text-primary">
                      {contractDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datas
                </h3>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de LiberaÃ§Ã£o</p>
                    <p className="font-medium">
                      {contractDetails.disbursed_at ? new Date(contractDetails.disbursed_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de CriaÃ§Ã£o</p>
                    <p className="font-medium">
                      {contractDetails.created_at ? new Date(contractDetails.created_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Anexos */}
              {contractDetails.attachments && contractDetails.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Anexos ({contractDetails.attachments.length})
                  </h3>
                  <div className="space-y-2 pl-6">
                    {contractDetails.attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{att.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {(att.size / 1024).toFixed(2)} KB â€¢ {att.created_at ? new Date(att.created_at).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${api.defaults.baseURL}/contracts/${contractDetails.id}/attachments/${att.id}/download`, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}

              {/* AÃ§Ãµes */}
              {!loadingContractDetails && contractDetails && (
                <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowContractModal(false);
                    router.push(`/casos/${contractDetails.case_id}`);
                  }}
                >
                  Ver Caso Completo
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowContractModal(false)}
                >
                  Fechar
                </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

