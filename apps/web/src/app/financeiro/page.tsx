"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import {
  useFinanceQueue,
  useFinanceDisburseSimple,
  useFinanceMetrics,
  useUploadContractAttachment,
  useCancelContract,
  useDeleteContract,
  useFinanceCaseDetails
} from "@/lib/hooks";
import { FinanceCard, FinanceMetrics, ExpenseModal, IncomeModal, Button, Tabs, TabsList, TabsTrigger, TabsContent, Card, QuickFilters } from "@lifecalling/ui";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Download, Plus, TrendingUp, Wallet, Trash2, Edit } from "lucide-react";

export default function Page(){
  useLiveCaseEvents();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading: loadingQueue } = useFinanceQueue();
  const { data: metrics, isLoading: loadingMetrics } = useFinanceMetrics();
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

  // Filtros rápidos
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Detalhes completos do caso
  const { data: fullCaseDetails } = useFinanceCaseDetails(selectedCaseId || 0);

  // Buscar despesas
  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await api.get("/finance/expenses");
      return response.data;
    }
  });

  const expenses = expensesData?.items || [];
  const expensesTotal = expensesData?.total || 0;

  // Buscar receitas manuais
  const { data: incomesData, isLoading: loadingIncomes } = useQuery({
    queryKey: ["incomes"],
    queryFn: async () => {
      const response = await api.get("/finance/incomes");
      return response.data;
    }
  });

  const incomes = incomesData?.items || [];
  const incomesTotal = incomesData?.total || 0;

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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Despesa excluída!");
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
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
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
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Receita excluída!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir receita");
    }
  });

  const handleDisburse = async (id: number) => {
    try {
      await disb.mutateAsync(id);
      toast.success("Liberação efetivada com sucesso!");
    } catch (error) {
      console.error('Erro ao efetivar:', error);
      toast.error("Erro ao efetivar liberação. Tente novamente.");
    }
  };

  const handleCancel = async (contractId: number) => {
    try {
      await cancelContract.mutateAsync(contractId);
      toast.success("Operação cancelada com sucesso!");
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error("Erro ao cancelar operação. Tente novamente.");
    }
  };

  const handleDelete = async (contractId: number) => {
    try {
      await deleteContract.mutateAsync(contractId);
      toast.success("Operação deletada com sucesso!");
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error("Erro ao deletar operação. Tente novamente.");
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

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm("Deseja realmente excluir esta despesa?")) {
      await deleteExpenseMutation.mutateAsync(id);
    }
  };

  const handleEditIncome = (income: any) => {
    setEditingIncome(income);
    setShowIncomeModal(true);
  };

  const handleDeleteIncome = async (id: number) => {
    if (confirm("Deseja realmente excluir esta receita?")) {
      await deleteIncomeMutation.mutateAsync(id);
    }
  };

  const handleExportReport = () => {
    window.open(`${api.defaults.baseURL}/finance/export`, '_blank');
  };

  // Filtros rápidos de status
  const availableFilters = [
    { id: "approved", label: "Aprovado", value: "approved", color: "success" as const, count: items.filter((i: any) => i.status === "fechamento_aprovado" && !i.contract).length },
    { id: "disbursed", label: "Liberado", value: "disbursed", color: "primary" as const, count: items.filter((i: any) => i.contract).length },
  ];

  const handleFilterToggle = (filterId: string) => {
    setStatusFilter(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setSearchTerm("");
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
      const hasContract = !!item.contract;
      if (statusFilter.includes("approved") && hasContract) return false;
      if (statusFilter.includes("disbursed") && !hasContract) return false;
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground mt-1">Visão geral das operações financeiras</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <QuickFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={statusFilter}
        onFilterToggle={handleFilterToggle}
        availableFilters={availableFilters}
        onClearAll={handleClearFilters}
        placeholder="Buscar por nome ou CPF..."
      />

      {/* Lista de Casos Financeiros */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Atendimentos para Liberação</h2>

        {loadingQueue ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando atendimentos...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {filteredItems.map((item: any) => {
              const contractId = item.contract?.id;
              const clientBankInfo = item.client ? {
                banco: item.client.banco,
                agencia: item.client.agencia,
                conta: item.client.conta,
                chave_pix: item.client.chave_pix,
                tipo_chave_pix: item.client.tipo_chave_pix
              } : undefined;

              // Extrair valores da simulação
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
                taxaJuros: 1.99, // Mock - adicionar no backend se necessário
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
        ) : (
          <Card className="p-12 text-center border-dashed">
            <p className="text-lg text-muted-foreground">✨ Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter.length > 0 || searchTerm ? "Tente ajustar os filtros" : "Todos os atendimentos financeiros foram processados."}
            </p>
          </Card>
        )}
      </div>

      {/* KPIs / Métricas Financeiras */}
      {loadingMetrics ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      ) : metrics ? (
        <FinanceMetrics {...metrics} />
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">Nenhuma métrica disponível</p>
        </Card>
      )}

      {/* Gestão de Receitas e Despesas com Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="receitas">
          <TabsList className="mb-4">
            <TabsTrigger value="receitas" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receitas Manuais
            </TabsTrigger>
            <TabsTrigger value="despesas" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Despesas
            </TabsTrigger>
          </TabsList>

          {/* Tab de Receitas */}
          <TabsContent value="receitas">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Receitas Manuais</h3>
                <Button
                  onClick={() => {
                    setEditingIncome(null);
                    setShowIncomeModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Receita
                </Button>
              </div>

              {loadingIncomes ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando receitas...</p>
                </div>
              ) : incomes.length > 0 ? (
                <>
                  <div className="rounded-lg border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-semibold">Data</th>
                            <th className="text-left p-3 font-semibold">Tipo</th>
                            <th className="text-left p-3 font-semibold">Nome</th>
                            <th className="text-right p-3 font-semibold">Valor</th>
                            <th className="text-right p-3 font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomes.map((income: any) => (
                            <tr key={income.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-3">{new Date(income.date).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-success/10 text-success">
                                  {income.income_type}
                                </span>
                              </td>
                              <td className="p-3">{income.income_name || '-'}</td>
                              <td className="p-3 text-right font-semibold text-success">
                                R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditIncome(income)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteIncome(income.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {/* Linha de total */}
                          <tr className="bg-success/5 border-t-2">
                            <td colSpan={3} className="p-3 text-right font-bold">Total</td>
                            <td className="p-3 text-right font-bold text-success text-lg">
                              R$ {incomesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <p>Nenhuma receita manual cadastrada</p>
                  <p className="text-sm mt-1">Clique em "Adicionar Receita" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab de Despesas */}
          <TabsContent value="despesas">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Despesas</h3>
                <Button
                  onClick={() => {
                    setEditingExpense(null);
                    setShowExpenseModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Despesa
                </Button>
              </div>

              {loadingExpenses ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando despesas...</p>
                </div>
              ) : expenses.length > 0 ? (
                <>
                  <div className="rounded-lg border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-semibold">Data</th>
                            <th className="text-left p-3 font-semibold">Tipo</th>
                            <th className="text-left p-3 font-semibold">Nome</th>
                            <th className="text-right p-3 font-semibold">Valor</th>
                            <th className="text-right p-3 font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense: any) => (
                            <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-3">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-danger/10 text-danger">
                                  {expense.expense_type}
                                </span>
                              </td>
                              <td className="p-3">{expense.expense_name}</td>
                              <td className="p-3 text-right font-semibold text-danger">
                                R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditExpense(expense)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteExpense(expense.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {/* Linha de total */}
                          <tr className="bg-danger/5 border-t-2">
                            <td colSpan={3} className="p-3 text-right font-bold">Total</td>
                            <td className="p-3 text-right font-bold text-danger text-lg">
                              R$ {expensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <p>Nenhuma despesa cadastrada</p>
                  <p className="text-sm mt-1">Clique em "Adicionar Despesa" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
    </div>
  );
}
