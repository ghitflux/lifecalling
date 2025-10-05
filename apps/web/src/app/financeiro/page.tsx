"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import {
  useFinanceQueue,
  useFinanceDisburseSimple,
  useUploadContractAttachment,
  useCancelContract,
  useDeleteContract,
  useFinanceCaseDetails,
  useDownloadExpenseAttachment,
  useDeleteExpenseAttachment,
  useDownloadIncomeAttachment,
  useDeleteIncomeAttachment,
  useIncomeAttachments,
  useExpenseAttachments,
  useUploadIncomeAttachment,
  useUploadExpenseAttachment
} from "@/lib/hooks";
import { FinanceCard, ExpenseModal, IncomeModal, AttachmentsModal, Button, Tabs, TabsList, TabsTrigger, TabsContent, Card, QuickFilters, Pagination, KPICard, MiniAreaChart, DateRangeFilter } from "@lifecalling/ui";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Download, Plus, TrendingUp, Wallet, Trash2, Edit, TrendingDown, Receipt, Target, Eye, FileText, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { startOfMonthBrasilia, endOfMonthBrasilia, formatDateBrasilia } from "@/lib/timezone";

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

  // Hooks para anexos de despesas e receitas (download e delete)
  const downloadExpenseAttachment = useDownloadExpenseAttachment();
  const deleteExpenseAttachment = useDeleteExpenseAttachment();
  const downloadIncomeAttachment = useDownloadIncomeAttachment();
  const deleteIncomeAttachment = useDeleteIncomeAttachment();
  const uploadIncomeAttachment = useUploadIncomeAttachment();
  const uploadExpenseAttachment = useUploadExpenseAttachment();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  // Filtros para transações
  const [transactionType, setTransactionType] = useState<string>("");  // "", "receita", "despesa"

  // Filtros por período personalizado
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });


  // Modal de detalhes do contrato
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Filtros rápidos
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detalhes completos do caso
  const { data: fullCaseDetails } = useFinanceCaseDetails(selectedCaseId || 0);

  // Buscar transações unificadas (receitas e despesas)
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions", transactionType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Usar o período personalizado
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      if (transactionType) params.append("transaction_type", transactionType);

      const response = await api.get(`/finance/transactions?${params.toString()}`);
      return response.data;
    }
  });

  const transactions = transactionsData?.items || [];
  const totals = transactionsData?.totals || { receitas: 0, despesas: 0, saldo: 0 };

  // Calcular paginação para transações
  const transactionsTotalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTransactions = transactions.slice((page - 1) * pageSize, page * pageSize);

  // Função para exportar CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("Nenhuma transação para exportar");
      return;
    }

    // Cabeçalhos do CSV
    const headers = ["Data", "Tipo", "Cliente", "CPF", "Atendente", "Categoria", "Descrição", "Valor"];

    // Converter transações para linhas CSV
    const rows = transactions.map((t: any) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'receita' ? 'Receita' : 'Despesa',
      t.client_name || '-',
      t.client_cpf ? t.client_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-',
      t.agent_name || '-',
      t.category,
      t.name || '-',
      `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    // Adicionar linha de totais
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Total Receitas',
      `R$ ${totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Total Despesas',
      `R$ ${totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Saldo',
      `R$ ${totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Criar blob e fazer download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : 'completo';
    link.setAttribute('download', `receitas-despesas-${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exportado com sucesso!");
  };

  // Buscar métricas do financeiro
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["financeMetrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Usar o período personalizado
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });

  const metrics = metricsData || {};

  // Calcular período anterior para comparação
  const calculatePreviousPeriod = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const prevEnd = new Date(start.getTime() - 1); // Um dia antes do período atual
    const prevStart = new Date(prevEnd.getTime() - (diffDays * 24 * 60 * 60 * 1000));
    
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0]
    };
  };

  const previousPeriod = calculatePreviousPeriod(startDate, endDate);

  // Buscar métricas do período anterior para comparação
  const { data: previousMetricsData } = useQuery({
    queryKey: ["financeMetrics", "previous", previousPeriod.startDate, previousPeriod.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("start_date", previousPeriod.startDate);
      params.append("end_date", previousPeriod.endDate);

      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });

  const previousMetrics = previousMetricsData || {};

  // Função para calcular tendência percentual
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  };

  // Calcular tendências reais
  const trends = {
    receita: calculateTrend(metrics.totalRevenue || 0, previousMetrics.totalRevenue || 0),
    despesas: calculateTrend(metrics.totalExpenses || 0, previousMetrics.totalExpenses || 0),
    lucro: calculateTrend(metrics.netProfit || 0, previousMetrics.netProfit || 0),
    consultoria: calculateTrend(metrics.totalConsultoriaLiq || 0, previousMetrics.totalConsultoriaLiq || 0),
    imposto: calculateTrend(
      (metrics.totalConsultoriaLiq || 0) * 0.14, 
      (previousMetrics.totalConsultoriaLiq || 0) * 0.14
    )
  };

  // Dados mockados para mini gráficos (últimos 7 dias)
  const MOCK_TREND_DATA = {
    receita: [
      { day: "Seg", value: 8500 },
      { day: "Ter", value: 12300 },
      { day: "Qua", value: 9800 },
      { day: "Qui", value: 15200 },
      { day: "Sex", value: 18700 },
      { day: "Sab", value: 11400 },
      { day: "Dom", value: 7200 }
    ],
    despesas: [
      { day: "Seg", value: 2100 },
      { day: "Ter", value: 3200 },
      { day: "Qua", value: 1800 },
      { day: "Qui", value: 4100 },
      { day: "Sex", value: 2900 },
      { day: "Sab", value: 1600 },
      { day: "Dom", value: 1200 }
    ],
    lucro: [
      { day: "Seg", value: 6400 },
      { day: "Ter", value: 9100 },
      { day: "Qua", value: 8000 },
      { day: "Qui", value: 11100 },
      { day: "Sex", value: 15800 },
      { day: "Sab", value: 9800 },
      { day: "Dom", value: 6000 }
    ],
    contratos: [
      { day: "Seg", value: 3 },
      { day: "Ter", value: 5 },
      { day: "Qua", value: 2 },
      { day: "Qui", value: 7 },
      { day: "Sex", value: 8 },
      { day: "Sab", value: 4 },
      { day: "Dom", value: 1 }
    ],
    consultoria: [
      { day: "Seg", value: 7200 },
      { day: "Ter", value: 10500 },
      { day: "Qua", value: 8400 },
      { day: "Qui", value: 13000 },
      { day: "Sex", value: 16000 },
      { day: "Sab", value: 9800 },
      { day: "Dom", value: 6200 }
    ],
    imposto: [
      { day: "Seg", value: 1008 },
      { day: "Ter", value: 1470 },
      { day: "Qua", value: 1176 },
      { day: "Qui", value: 1820 },
      { day: "Sex", value: 2240 },
      { day: "Sab", value: 1372 },
      { day: "Dom", value: 868 }
    ]
  };

  // Buscar detalhes do contrato (quando vindo da transação pelo case_id)
  const { data: contractDetails, isLoading: loadingContractDetails } = useQuery({
    queryKey: ["contract", selectedContractId, selectedCaseId],
    queryFn: async () => {
      // Se tiver case_id, busca os detalhes do caso no financeiro
      if (selectedCaseId) {
        const response = await api.get(`/finance/case/${selectedCaseId}`);
        return response.data;
      }
      // Senão, busca pelo contract_id (método antigo)
      if (selectedContractId) {
        const response = await api.get(`/finance/contracts/${selectedContractId}`);
        return response.data;
      }
      return null;
    },
    enabled: !!(selectedContractId || selectedCaseId)
  });

  // Mutation para salvar despesa
  const saveExpenseMutation = useMutation({
    mutationFn: async ({data, files}: {data: any, files?: File[]}) => {
      let expense;
      if (editingExpense) {
        const response = await api.put(`/finance/expenses/${editingExpense.id}`, data);
        expense = response.data;
      } else {
        const response = await api.post("/finance/expenses", data);
        expense = response.data;
      }

      // Se houver arquivos, fazer upload automaticamente
      if (files && files.length > 0 && expense.id) {
        try {
          if (files.length === 1) {
            // Usar endpoint singular para compatibilidade
            const formData = new FormData();
            formData.append('file', files[0]);
            await api.post(`/finance/expenses/${expense.id}/attachment`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } else {
            // Usar endpoint plural para múltiplos arquivos
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            await api.post(`/finance/expenses/${expense.id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload de anexo:', uploadError);
          // Avisar sobre falha no upload mas não falhar toda a operação
          toast.warning("Despesa salva, mas houve erro ao enviar o anexo. Tente anexar o arquivo novamente.");
        }
      }

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingExpense ? "Despesa atualizada!" : "Despesa adicionada com sucesso!");
      setShowExpenseModal(false);
      setEditingExpense(null);
    },
    onError: (error: any) => {
      console.error('Erro ao salvar despesa:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : "Erro ao salvar despesa";
      toast.error(errorMessage);
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
      toast.success("Despesa excluída!");
    },
    onError: (error: any) => {
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : "Erro ao excluir despesa";
      toast.error(errorMessage);
    }
  });

  // Mutation para salvar receita
  const saveIncomeMutation = useMutation({
    mutationFn: async ({data, files}: {data: any, files?: File[]}) => {
      let income;
      if (editingIncome) {
        const response = await api.put(`/finance/incomes/${editingIncome.id}`, data);
        income = response.data;
      } else {
        const response = await api.post("/finance/incomes", data);
        income = response.data;
      }

      // Se houver arquivos, fazer upload automaticamente
      if (files && files.length > 0 && income.id) {
        try {
          if (files.length === 1) {
            // Usar endpoint singular para compatibilidade
            const formData = new FormData();
            formData.append('file', files[0]);
            await api.post(`/finance/incomes/${income.id}/attachment`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } else {
            // Usar endpoint plural para múltiplos arquivos
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            await api.post(`/finance/incomes/${income.id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload de anexo:', uploadError);
          // Avisar sobre falha no upload mas não falhar toda a operação
          toast.warning("Receita salva, mas houve erro ao enviar o anexo. Tente anexar o arquivo novamente.");
        }
      }

      return income;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingIncome ? "Receita atualizada!" : "Receita adicionada com sucesso!");
      setShowIncomeModal(false);
      setEditingIncome(null);
    },
    onError: (error: any) => {
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : "Erro ao salvar receita";
      toast.error(errorMessage);
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
      toast.success("Receita excluída!");
    },
    onError: (error: any) => {
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : "Erro ao excluir receita";
      toast.error(errorMessage);
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

  const handleViewAttachments = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowAttachmentsModal(true);
  };

  // Componente wrapper para gerenciar anexos por tipo
  const AttachmentsModalWrapper = ({ transaction, isOpen, onClose }: any) => {
    const incomeAttachments = useIncomeAttachments(transaction.type === 'receita' ? transaction.id : 0);
    const expenseAttachments = useExpenseAttachments(transaction.type === 'despesa' ? transaction.id : 0);

    const attachments = transaction.type === 'receita'
      ? incomeAttachments.data || []
      : expenseAttachments.data || [];

    const handleDownload = (attachmentId: string) => {
      if (transaction.type === 'receita') {
        downloadIncomeAttachment.mutate(transaction.id, {
          onSuccess: (response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = response.headers['content-disposition']?.split('filename=')[1] || 'anexo.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
          }
        });
      } else {
        downloadExpenseAttachment.mutate(transaction.id, {
          onSuccess: (response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = response.headers['content-disposition']?.split('filename=')[1] || 'anexo.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
          }
        });
      }
    };

    const handleDelete = (attachmentId: string) => {
      if (transaction.type === 'receita') {
        deleteIncomeAttachment.mutate(transaction.id, {
          onSuccess: () => {
            toast.success("Anexo removido!");
            incomeAttachments.refetch();
          }
        });
      } else {
        deleteExpenseAttachment.mutate(transaction.id, {
          onSuccess: () => {
            toast.success("Anexo removido!");
            expenseAttachments.refetch();
          }
        });
      }
    };

    const handleUpload = (files: File[]) => {
      files.forEach(file => {
        if (transaction.type === 'receita') {
          uploadIncomeAttachment.mutate({ incomeId: transaction.id, file }, {
            onSuccess: () => {
              toast.success("Anexo adicionado!");
              incomeAttachments.refetch();
            }
          });
        } else {
          uploadExpenseAttachment.mutate({ expenseId: transaction.id, file }, {
            onSuccess: () => {
              toast.success("Anexo adicionado!");
              expenseAttachments.refetch();
            }
          });
        }
      });
    };

    return (
      <AttachmentsModal
        isOpen={isOpen}
        onClose={onClose}
        transaction={transaction}
        attachments={attachments}
        onDownloadAttachment={handleDownload}
        onDeleteAttachment={handleDelete}
        onUploadAttachment={handleUpload}
        loading={uploadIncomeAttachment.isPending || uploadExpenseAttachment.isPending}
      />
    );
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



  // Filtros rápidos de status
  const statusCounts = {
    aprovado: items.filter((i: any) =>
      ["fechamento_aprovado", "financeiro_pendente"].includes(i.status) && !i.contract
    ).length,
    liberado: items.filter((i: any) =>
      i.status === "contrato_efetivado" || (!!i.contract && i.status !== "contrato_cancelado")
    ).length,
    cancelado: items.filter((i: any) => i.status === "contrato_cancelado").length,
    todos: items.length
  };

  const availableFilters = [
    { id: "aprovado", label: "Fechamento Aprovado", value: "aprovado", color: "success" as const, count: statusCounts.aprovado },
    { id: "liberado", label: "Contrato Efetivado", value: "liberado", color: "primary" as const, count: statusCounts.liberado },
    { id: "cancelado", label: "Cancelados", value: "cancelado", color: "danger" as const, count: statusCounts.cancelado }
  ];

  const handleFilterToggle = (filterId: string) => {
    setStatusFilter(prev => (prev.includes(filterId) ? [] : [filterId]));
    setPage(1); // Reset para primeira página ao filtrar
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setSearchTerm("");
    setPage(1);
  };

  // Gerar filtros rápidos por mês usando timezone de Brasília
  const generateMonthFilters = () => {
    const months = [
      { value: '01', label: 'Jan' },
      { value: '02', label: 'Fev' },
      { value: '03', label: 'Mar' },
      { value: '04', label: 'Abr' },
      { value: '05', label: 'Mai' },
      { value: '06', label: 'Jun' },
      { value: '07', label: 'Jul' },
      { value: '08', label: 'Ago' },
      { value: '09', label: 'Set' },
      { value: '10', label: 'Out' },
      { value: '11', label: 'Nov' },
      { value: '12', label: 'Dez' }
    ];

    const currentYear = new Date().getFullYear();
    return months.map(month => ({
      id: `${currentYear}-${month.value}`,
      label: month.label,
      value: `${currentYear}-${month.value}`,
      isActive: false
    }));
  };

  const handleMonthFilter = (monthValue: string) => {
    // Calcular start_date e end_date do mês selecionado
    const [year, month] = monthValue.split('-');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);

    const monthStart = startOfMonthBrasilia(targetDate);
    const monthEnd = endOfMonthBrasilia(targetDate);

    // setSelectedMonth(monthValue); // removido: variável não existe
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
          // Pendente de liberação: status aprovado/pendente E sem contrato
          if (!(["fechamento_aprovado", "financeiro_pendente"].includes(item.status) && !item.contract)) {
            return false;
          }
          break;
        case "liberado":
          // Contrato efetivado: status contrato_efetivado OU tem contrato e não está cancelado
          if (!(item.status === "contrato_efetivado" || (!!item.contract && item.status !== "contrato_cancelado"))) {
            return false;
          }
          break;
        case "cancelado":
          // Contratos cancelados
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

  // Calcular paginação para items
  const totalItems = filteredItems.length;
  const itemsTotalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground mt-1">Visão geral das operações financeiras</p>
        </div>

      </div>

      {/* Filtros por Mês */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtros por Período</h3>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onClear={() => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
          }}
          label="Filtrar período:"
          className="mb-4"
        />
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Receita Total"
          value={`R$ ${(metrics.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Período selecionado"
          isLoading={metricsLoading}
          gradientVariant="emerald"
          trend={trends.receita}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.receita}
              dataKey="value"
              xKey="day"
              stroke="#10b981"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <KPICard
          title="Despesas"
          value={`R$ ${(metrics.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Período selecionado"
          isLoading={metricsLoading}
          gradientVariant="rose"
          trend={trends.despesas}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.despesas}
              dataKey="value"
              xKey="day"
              stroke="#f43f5e"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <KPICard
          title="Lucro Líquido"
          value={`R$ ${(metrics.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Receitas - Despesas - Impostos"
          isLoading={metricsLoading}
          gradientVariant="violet"
          trend={trends.lucro}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.lucro}
              dataKey="value"
              xKey="day"
              stroke="#8b5cf6"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <KPICard
          title="Receita Consultoria"
          value={`R$ ${(metrics.totalConsultoriaLiq || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Consultorias líquidas"
          isLoading={metricsLoading}
          gradientVariant="sky"
          trend={trends.consultoria}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.consultoria}
              dataKey="value"
              xKey="day"
              stroke="#0ea5e9"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <KPICard
          title="Imposto"
          value={`R$ ${(((metrics.totalConsultoriaLiq || 0) * 0.14) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="14% sobre Consultoria Líquida"
          isLoading={metricsLoading}
          gradientVariant="amber"
          trend={trends.imposto}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.imposto}
              dataKey="value"
              xKey="day"
              stroke="#f59e0b"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
      </div>

      {/* Filtros Rápidos */}
      <QuickFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1); // Reset para primeira página ao buscar
        }}
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

              // Mapear status do backend para o FinanceCard
              const cardStatus = (() => {
                if (item.status === "contrato_cancelado") return "disbursed"; // Cancelado também usa disbursed mas com botões diferentes
                if (item.status === "contrato_efetivado" || item.contract) return "disbursed";
                return "approved";
              })();

              return (
                <FinanceCard
                  key={item.id}
                  id={item.id}
                  clientName={item.client?.name || `Cliente ${item.id}`}
                  totalAmount={item.contract?.total_amount || item.simulation?.totals.liberadoTotal || 0}
                  installments={item.contract?.installments || item.simulation?.prazo || 0}
                  status={cardStatus}
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

          {/* Paginação */}
          {totalItems > pageSize && (
            <Pagination
              currentPage={page}
              totalPages={itemsTotalPages}
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
            <p className="text-lg text-muted-foreground">✨ Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter.length > 0 || searchTerm ? "Tente ajustar os filtros" : "Todos os atendimentos financeiros foram processados."}
            </p>
          </Card>
        )}
      </div>

      {/* Gestão de Receitas e Despesas */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Receitas e Despesas</h3>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
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



          {/* Abas de Tipos de Transação */}
          <Tabs value={transactionType || "todas"} onValueChange={(v) => setTransactionType(v === "todas" ? "" : v)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="receita">Receitas</TabsTrigger>
              <TabsTrigger value="despesa">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tabela Unificada - REDESENHADA */}
          {loadingTransactions ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando transações...</p>
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
                        <th className="text-left p-3 font-semibold">Cliente</th>
                        <th className="text-left p-3 font-semibold">CPF</th>
                        <th className="text-left p-3 font-semibold">Atendente</th>
                        <th className="text-left p-3 font-semibold">Categoria</th>
                        <th className="text-left p-3 font-semibold">Descrição</th>
                        <th className="text-right p-3 font-semibold">Valor</th>
                        <th className="text-center p-3 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction: any) => (
                        <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/30">
                          {/* Data */}
                          <td className="p-3 text-sm whitespace-nowrap">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </td>

                          {/* Tipo */}
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                              transaction.type === 'receita'
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>

                          {/* Cliente */}
                          <td className="p-3 text-sm">
                            {transaction.client_name ? (
                              <span className="font-medium">{transaction.client_name}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* CPF */}
                          <td className="p-3 text-sm font-mono">
                            {transaction.client_cpf ? (
                              <span className="text-muted-foreground">
                                {transaction.client_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Atendente */}
                          <td className="p-3 text-sm">
                            {transaction.agent_name ? (
                              <span className="font-medium">{transaction.agent_name}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Categoria */}
                          <td className="p-3 text-sm">
                            <span className="px-2 py-1 bg-muted rounded-md text-xs">
                              {transaction.category}
                            </span>
                          </td>

                          {/* Descrição */}
                          <td className="p-3 text-sm max-w-xs truncate">
                            {transaction.name || '-'}
                          </td>

                          {/* Valor */}
                          <td className={`p-3 text-right font-semibold whitespace-nowrap ${
                            transaction.type === 'receita' ? 'text-success' : 'text-danger'
                          }`}>
                            R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Ações */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {/* Botão Ver Detalhes do Atendimento (apenas para receitas de consultoria) */}
                              {transaction.type === 'receita' && transaction.case_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCaseId(transaction.case_id);
                                    setShowContractModal(true);
                                  }}
                                  className="h-9 px-3 gap-2"
                                  title="Ver detalhes do atendimento"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline">Detalhes</span>
                                </Button>
                              )}

                              {/* Botão Ver Anexos */}
                              {transaction.has_attachment && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewAttachments(transaction)}
                                  className="h-9 px-3 gap-2"
                                  title="Ver anexos"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="hidden sm:inline">Anexos</span>
                                </Button>
                              )}

                              {/* Botão Editar */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTransaction(transaction)}
                                className="h-9 px-3 gap-2"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>

                              {/* Botão Excluir */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="h-9 px-3 gap-2 text-danger hover:text-danger hover:bg-danger/10"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Excluir</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Linhas de totais */}
                      <tr className="bg-muted/20 border-t-2">
                        <td colSpan={7} className="p-3 text-right font-bold text-sm">Total Receitas</td>
                        <td className="p-3 text-right font-bold text-success text-base">
                          R$ {totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="p-3 text-right font-bold text-sm">Total Despesas</td>
                        <td className="p-3 text-right font-bold text-danger text-base">
                          R$ {totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-muted/30 border-t-2">
                        <td colSpan={7} className="p-3 text-right font-bold text-sm">Saldo</td>
                        <td className={`p-3 text-right font-bold text-base ${
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

              {/* Controles de Paginação */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Linhas por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border rounded-md px-2 py-1 text-sm bg-background"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-muted-foreground ml-4">
                    Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, transactions.length)} de {transactions.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {page} de {transactionsTotalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= transactionsTotalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm mt-1">Adicione receitas ou despesas para começar</p>
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
        onSubmit={(data, files) => saveExpenseMutation.mutate({data, files})}
        onDownloadAttachment={(expenseId) => {
          downloadExpenseAttachment.mutate(expenseId, {
            onSuccess: (response) => {
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.download = response.headers['content-disposition']?.split('filename=')[1] || 'anexo.pdf';
              link.click();
              window.URL.revokeObjectURL(url);
            }
          });
        }}
        onDeleteAttachment={(expenseId) => {
          if (confirm("Deseja realmente remover este anexo?")) {
            deleteExpenseAttachment.mutate(expenseId, {
              onSuccess: () => {
                toast.success("Anexo removido!");
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
              }
            });
          }
        }}
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
        onSubmit={(data, files) => saveIncomeMutation.mutate({data, files})}
        onDownloadAttachment={(incomeId) => {
          downloadIncomeAttachment.mutate(incomeId, {
            onSuccess: (response) => {
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.download = response.headers['content-disposition']?.split('filename=')[1] || 'anexo.pdf';
              link.click();
              window.URL.revokeObjectURL(url);
            }
          });
        }}
        onDeleteAttachment={(incomeId) => {
          if (confirm("Deseja realmente remover este anexo?")) {
            deleteIncomeAttachment.mutate(incomeId, {
              onSuccess: () => {
                toast.success("Anexo removido!");
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
              }
            });
          }
        }}
        initialData={editingIncome}
        loading={saveIncomeMutation.isPending}
      />

      {/* Modal de Detalhes do Atendimento/Contrato */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {
          setShowContractModal(false);
          setSelectedCaseId(null);
          setSelectedContractId(null);
        }}>
          <div className="bg-card border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {loadingContractDetails || !contractDetails
                      ? "Carregando..."
                      : contractDetails.contract
                        ? `Detalhes do Contrato #${contractDetails.contract.id}`
                        : "Detalhes do Atendimento"}
                  </h2>
                  {contractDetails && (
                    <p className="text-muted-foreground mt-1">
                      Atendimento #{contractDetails.id || contractDetails.case_id}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowContractModal(false);
                    setSelectedCaseId(null);
                    setSelectedContractId(null);
                  }}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button>
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
                      <p className="text-sm text-muted-foreground">Matrícula</p>
                      <p className="font-medium">{contractDetails.client.matricula}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Órgão</p>
                      <p className="font-medium">{contractDetails.client.orgao || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulação */}
              {contractDetails.simulation && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Dados da Simulação
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pl-6 bg-muted/20 p-3 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Financiado</p>
                      <p className="font-bold">R$ {(contractDetails.simulation.totals?.totalFinanciado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Liberado Cliente</p>
                      <p className="font-bold text-success">R$ {(contractDetails.simulation.totals?.liberadoCliente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Consultoria (Bruto)</p>
                      <p className="font-medium">R$ {(contractDetails.simulation.totals?.custoConsultoria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Consultoria Líquida (86%)</p>
                      <p className="font-medium text-success">R$ {(contractDetails.simulation.totals?.custoConsultoriaLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prazo</p>
                      <p className="font-medium">{contractDetails.simulation.prazo || 0} meses</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">% Consultoria</p>
                      <p className="font-medium">{contractDetails.simulation.percentual_consultoria || 0}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contrato */}
              {contractDetails.contract && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dados do Contrato
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pl-6 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-lg">R$ {(contractDetails.contract.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className="inline-block px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium">
                        {contractDetails.contract.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Parcelas</p>
                      <p className="font-medium">{contractDetails.contract.paid_installments || 0}/{contractDetails.contract.installments || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Liberação</p>
                      <p className="font-medium">
                        {contractDetails.contract.disbursed_at ? new Date(contractDetails.contract.disbursed_at).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Anexos do Contrato */}
              {contractDetails.contract?.attachments && contractDetails.contract.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Anexos ({contractDetails.contract.attachments.length})
                  </h3>
                  <div className="space-y-2 pl-6">
                    {contractDetails.contract.attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{att.filename}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(att.size / 1024).toFixed(2)} KB • {att.created_at ? new Date(att.created_at).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${api.defaults.baseURL}/contracts/${contractDetails.contract.id}/attachments/${att.id}/download`, '_blank')}
                          className="ml-3"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}

              {/* Ações */}
              {!loadingContractDetails && contractDetails && (
                <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowContractModal(false);
                    setSelectedCaseId(null);
                    setSelectedContractId(null);
                    const caseId = contractDetails.id || contractDetails.case_id;
                    router.push(`/calculista/${caseId}`);
                  }}
                >
                  Ver Atendimento Completo
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setShowContractModal(false);
                    setSelectedCaseId(null);
                    setSelectedContractId(null);
                  }}
                >
                  Fechar
                </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anexos */}
      {selectedTransaction && (
        <AttachmentsModalWrapper
          transaction={selectedTransaction}
          isOpen={showAttachmentsModal}
          onClose={() => {
            setShowAttachmentsModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}

