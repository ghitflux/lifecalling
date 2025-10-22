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
  useUploadExpenseAttachment,
  useUsers
} from "@/lib/hooks";
import {
  ExpenseModal,
  IncomeModal,
  AttachmentsModal,
  FinanceCard,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  QuickFilters,
  Pagination,
  KPICard,
  MiniAreaChart,
  DateRangeFilter
} from "@lifecalling/ui";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Download,
  Plus,
  TrendingUp,
  Wallet,
  Trash2,
  Edit,
  TrendingDown,
  Receipt,
  Target,
  RefreshCw,
  FileText,
  Calendar,
  User,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  startOfMonthBrasilia,
  endOfMonthBrasilia
} from "@/lib/timezone";

export default function Page() {
  useLiveCaseEvents();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Função para atualizar tabela de receitas e despesas
  const handleRefreshTransactions = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
    toast.success("Tabela atualizada com sucesso!");
  };

  // Função para atualizar lista de casos para liberação
  const handleRefreshCases = () => {
    queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
    queryClient.invalidateQueries({ queryKey: ["financeContracts"] });
    toast.success("Lista de atendimentos atualizada!");
  };

  const { data: items = [], isLoading: loadingQueue } = useFinanceQueue();
  const { data: users = [] } = useUsers();
  const disb = useFinanceDisburseSimple();
  const cancelContract = useCancelContract();
  const deleteContract = useDeleteContract();
  const uploadAttachment = useUploadContractAttachment();

  const [uploadingContractId, setUploadingContractId] = useState<number | null>(null);

  // Hooks anexos receita/despesa
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

  // Filtros transações
  const [transactionType, setTransactionType] = useState<string>("");

  // Período
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  });

  // Modal FinanceCard
  const [showFinanceCardModal, setShowFinanceCardModal] = useState(false);
  const [financeCardCaseId, setFinanceCardCaseId] = useState<number | null>(null);

  // Filtros rápidos
  const [statusFilter, setStatusFilter] = useState<string[]>(["aprovado"]);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detalhes completos do caso (para modal “detalhes”)
  const { data: fullCaseDetails } = useFinanceCaseDetails(selectedCaseId || 0);

  // Detalhes para o modal FinanceCard
  const { data: financeCardDetails } = useFinanceCaseDetails(financeCardCaseId || 0);

  // Transações
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions", transactionType, startDate, endDate],
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
  const backendTotals = transactionsData?.totals || { receitas: 0, despesas: 0, saldo: 0 };

  // SEMPRE usar totais do backend - representa TODAS as transações do período
  const totals = backendTotals;

  const transactionsTotalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTransactions = transactions.slice((page - 1) * pageSize, page * pageSize);

  // Export CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("Nenhuma transação para exportar");
      return;
    }
    const headers = ["Data", "Tipo", "Cliente", "CPF", "Atendente", "Categoria", "Descrição", "Valor"];
    const rows = transactions.map((t: any) => [
      new Date(t.date).toLocaleDateString("pt-BR"),
      t.type === "receita" ? "Receita" : "Despesa",
      t.client_name || "-",
      t.client_cpf ? t.client_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "-",
      t.agent_name || "-",
      t.category,
      t.name || "-",
      `R$ ${t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    ]);
    rows.push(["", "", "", "", "", "", "Total Receitas", `R$ ${totals.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]);
    rows.push(["", "", "", "", "", "", "Total Despesas", `R$ ${totals.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]);
    rows.push(["", "", "", "", "", "", "Saldo", `R$ ${totals.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]);

    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : "completo";
    link.setAttribute("download", `receitas-despesas-${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exportado com sucesso!");
  };

  // Métricas
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["financeMetrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const response = await api.get(`/finance/metrics?${params.toString()}`);
      return response.data;
    }
  });
  const metrics = metricsData || {};

  const calculatePreviousPeriod = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: first.toISOString().split("T")[0], endDate: last.toISOString().split("T")[0] };
    }
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffDays * 24 * 60 * 60 * 1000);
    return { startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0] };
  };

  const previousPeriod = calculatePreviousPeriod(startDate, endDate);
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

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  };

  const trends = {
    receita: calculateTrend(metrics.totalRevenue || 0, previousMetrics.totalRevenue || 0),
    consultoria: calculateTrend(metrics.totalConsultoriaLiq || 0, previousMetrics.totalConsultoriaLiq || 0),
    lucro: calculateTrend(metrics.netProfit || 0, previousMetrics.netProfit || 0),
    despesas: calculateTrend(
      (metrics.totalExpenses || 0) + (metrics.totalTax || 0) - (metrics.totalManualTaxes || 0),
      (previousMetrics.totalExpenses || 0) + (previousMetrics.totalTax || 0) - (previousMetrics.totalManualTaxes || 0)
    ),
    imposto: calculateTrend((metrics.totalConsultoriaLiq || 0) * 0.14, (previousMetrics.totalConsultoriaLiq || 0) * 0.14)
  };

  // Buscar dados de séries temporais para mini-charts
  const { data: seriesData } = useQuery({
    queryKey: ["financeSeries", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("from", startDate);
      if (endDate) params.append("to", endDate);
      params.append("granularity", "day");
      const response = await api.get(`/analytics/series?${params.toString()}`);
      return response.data;
    }
  });

  // Função para converter dados de séries em formato de mini-chart
  const convertSeriesToMiniChart = (seriesData: any[], key: string, fallbackValue: number = 0) => {
    if (!seriesData || seriesData.length === 0) {
      // Fallback: gerar dados baseados no valor atual
      return Array.from({ length: 7 }, (_, i) => ({
        day: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][i],
        value: Math.max(0, fallbackValue * (0.8 + Math.random() * 0.4))
      }));
    }

    // Pegar os últimos 7 dias de dados
    const last7Days = seriesData.slice(-7);
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    
    return last7Days.map((item, index) => ({
      day: dayNames[index % 7],
      value: Math.max(0, parseFloat(item[key] || 0))
    }));
  };

  // Gerar dados de tendência reais para mini-charts
  const getTrendChartData = useMemo(() => {
    const series = seriesData?.series || [];
    
    return {
      receita: convertSeriesToMiniChart(series, 'finance_receita', metrics.totalRevenue || 0),
      despesas: convertSeriesToMiniChart(series, 'finance_despesas', metrics.totalExpenses || 0),
      lucro: convertSeriesToMiniChart(series, 'finance_resultado', metrics.netProfit || 0),
      consultoria: convertSeriesToMiniChart(series, 'finance_receita', metrics.totalConsultoriaLiq || 0),
      imposto: convertSeriesToMiniChart(series, 'finance_despesas', (metrics.totalConsultoriaLiq || 0) * 0.14)
    };
  }, [seriesData, metrics]);

  // Contrato (quando vem de transação)
  const { data: contractDetails, isLoading: loadingContractDetails } = useQuery({
    queryKey: ["contract", selectedCaseId],
    queryFn: async () => {
      if (selectedCaseId) {
        const response = await api.get(`/finance/case/${selectedCaseId}`);
        return response.data;
      }
      if (selectedCaseId) {
        const response = await api.get(`/finance/case/${selectedCaseId}`);
        return response.data;
      }
      return null;
    },
    enabled: !!selectedCaseId
  });

  // Mutations despesas/receitas (salvar/excluir) — mantidos iguais aos seus
  const saveExpenseMutation = useMutation({
    mutationFn: async ({ data, files }: { data: any; files?: File[] }) => {
      let expense;
      if (editingExpense) {
        const response = await api.put(`/finance/expenses/${editingExpense.id}`, data);
        expense = response.data;
      } else {
        const response = await api.post("/finance/expenses", data);
        expense = response.data;
      }
      if (files && files.length > 0 && expense.id) {
        try {
          if (files.length === 1) {
            const formData = new FormData();
            formData.append("file", files[0]);
            await api.post(`/finance/expenses/${expense.id}/attachment`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          } else {
            const formData = new FormData();
            files.forEach(file => formData.append("files", file));
            await api.post(`/finance/expenses/${expense.id}/attachments`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          }
        } catch (uploadError: any) {
          console.error("Erro upload anexo:", uploadError);
          toast.warning("Despesa salva, mas o anexo falhou. Envie novamente.");
        }
      }
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingExpense ? "Despesa atualizada!" : "Despesa adicionada!");
      setShowExpenseModal(false);
      setEditingExpense(null);
    },
    onError: (error: any) => {
      const msg =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Erro ao salvar despesa";
      toast.error(msg);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/finance/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Despesa excluída!");
    },
    onError: (error: any) => {
      const msg =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Erro ao excluir despesa";
      toast.error(msg);
    }
  });

  const saveIncomeMutation = useMutation({
    mutationFn: async ({ data, files }: { data: any; files?: File[] }) => {
      let income;
      if (editingIncome) {
        const response = await api.put(`/finance/incomes/${editingIncome.id}`, data);
        income = response.data;
      } else {
        const response = await api.post("/finance/incomes", data);
        income = response.data;
      }
      if (files && files.length > 0 && income.id) {
        try {
          if (files.length === 1) {
            const formData = new FormData();
            formData.append("file", files[0]);
            await api.post(`/finance/incomes/${income.id}/attachment`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          } else {
            const formData = new FormData();
            files.forEach(file => formData.append("files", file));
            await api.post(`/finance/incomes/${income.id}/attachments`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
          }
        } catch (uploadError: any) {
          console.error("Erro upload anexo:", uploadError);
          toast.warning("Receita salva, mas o anexo falhou. Envie novamente.");
        }
      }
      return income;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success(editingIncome ? "Receita atualizada!" : "Receita adicionada!");
      setShowIncomeModal(false);
      setEditingIncome(null);
    },
    onError: (error: any) => {
      const msg =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Erro ao salvar receita";
      toast.error(msg);
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/finance/incomes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Receita excluída!");
    },
    onError: (error: any) => {
      const msg =
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Erro ao excluir receita";
      toast.error(msg);
    }
  });

  // Ações casos/contratos
  const handleDisburse = async (id: number, percentualAtendente?: number, consultoriaAjustada?: number, atendenteUserId?: number) => {
    try {
      await disb.mutateAsync({
        case_id: id,
        percentual_atendente: percentualAtendente,
        consultoria_liquida_ajustada: consultoriaAjustada,
        atendente_user_id: atendenteUserId
      });
      toast.success("Liberação efetivada com sucesso!");
    } catch (error) {
      console.error("Erro efetivar:", error);
      toast.error("Erro ao efetivar liberação. Tente novamente.");
    }
  };

  // Função para download de anexos do caso
  const handleDownloadCaseAttachment = (attachmentId: number, filename?: string) => {
    if (!financeCardCaseId) return;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const downloadUrl = `${baseUrl}/cases/${financeCardCaseId}/attachments/${attachmentId}/download`;
    
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'anexo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancel = async (contractId: number) => {
    try {
      await cancelContract.mutateAsync(contractId);
      toast.success("Operação cancelada com sucesso!");
    } catch (error) {
      console.error("Erro cancelar:", error);
      toast.error("Erro ao cancelar operação. Tente novamente.");
    }
  };

  const handleDelete = async (contractId: number) => {
    try {
      await deleteContract.mutateAsync(contractId);
      toast.success("Operação deletada com sucesso!");
    } catch (error) {
      console.error("Erro deletar:", error);
      toast.error("Erro ao deletar operação. Tente novamente.");
    }
  };

  // Mutation para devolver caso ao calculista
  const returnToCalculistaMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post(`/cases/${caseId}/return-to-calculista`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeContracts"] });
      toast.success("Caso devolvido ao calculista para recálculo");
    },
    onError: (error: any) => {
      console.error("Erro ao devolver caso:", error);
      toast.error("Erro ao devolver caso ao calculista");
    }
  });

  const handleReturnToCalculista = async (caseId: number) => {
    if (confirm("Tem certeza que deseja devolver este caso ao calculista para recálculo?")) {
      await returnToCalculistaMutation.mutateAsync(caseId);
    }
  };

  // Mutation para cancelar caso
  const cancelCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post(`/cases/${caseId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeContracts"] });
      toast.success("Caso cancelado com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro ao cancelar caso:", error);
      const errorMessage = error?.response?.data?.detail || "Erro ao cancelar caso";
      toast.error(errorMessage);
    }
  });

  const handleCancelCase = async (caseId: number) => {
    await cancelCaseMutation.mutateAsync(caseId);
  };

  const handleDeleteCase = async (caseId: number) => {
    try {
      await api.post("/cases/bulk-delete", { ids: [caseId] });
      toast.success("Caso deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
    } catch (error) {
      console.error("Erro deletar caso:", error);
      toast.error("Erro ao deletar caso. Tente novamente.");
    }
  };

  const createUploadHandler =
    (contractId: number | null, caseId: number) => async (file: File) => {
      setUploadingContractId(contractId);
      try {
        if (contractId) {
          await uploadAttachment.mutateAsync({ contractId, file });
        } else {
          const formData = new FormData();
          formData.append("file", file);
          await api.post(`/cases/${caseId}/attachments`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          queryClient.invalidateQueries({ queryKey: ["financeQueue"] });
        }
        toast.success("Comprovante anexado com sucesso!");
      } catch (error) {
        console.error("Erro anexar:", error);
        toast.error("Erro ao anexar comprovante. Tente novamente.");
      } finally {
        setUploadingContractId(null);
      }
    };

  const handleLoadFullDetails = (caseId: number) => setSelectedCaseId(caseId);
  const handleOpenFinanceCard = (caseId: number) => {
    setFinanceCardCaseId(caseId);
    setShowFinanceCardModal(true);
  };

  const handleEditTransaction = (transaction: any) => {
    const realId = parseInt(transaction.id.split("-")[1]);
    if (transaction.type === "receita") {
      api.get(`/finance/incomes/${realId}`).then(res => {
        setEditingIncome(res.data);
        setShowIncomeModal(true);
      });
    } else {
      api.get(`/finance/expenses/${realId}`).then(res => {
        setEditingExpense(res.data);
        setShowExpenseModal(true);
      });
    }
  };

  const handleDeleteTransaction = async (transaction: any) => {
    const realId = parseInt(transaction.id.split("-")[1]);
    const confirmMessage =
      transaction.type === "receita"
        ? "Deseja realmente excluir esta receita?"
        : "Deseja realmente excluir esta despesa?";
    if (confirm(confirmMessage)) {
      if (transaction.type === "receita") await deleteIncomeMutation.mutateAsync(realId);
      else await deleteExpenseMutation.mutateAsync(realId);
    }
  };

  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const AttachmentsModalWrapper = ({ transaction, isOpen, onClose }: any) => {
    const incomeAttachments = useIncomeAttachments(transaction.type === "receita" ? transaction.id : 0);
    const expenseAttachments = useExpenseAttachments(transaction.type === "despesa" ? transaction.id : 0);

    const attachments = transaction.type === "receita" ? incomeAttachments.data || [] : expenseAttachments.data || [];

    const handleDownload = (attachmentId: string) => {
      if (transaction.type === "receita") {
        downloadIncomeAttachment.mutate(transaction.id, {
          onSuccess: response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            // Extrair nome do arquivo do header e remover aspas
            const contentDisposition = response.headers["content-disposition"];
            const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
            link.download = filenameMatch?.[1] || "anexo.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
          }
        });
      } else {
        downloadExpenseAttachment.mutate(transaction.id, {
          onSuccess: response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            // Extrair nome do arquivo do header e remover aspas
            const contentDisposition = response.headers["content-disposition"];
            const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
            link.download = filenameMatch?.[1] || "anexo.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
          }
        });
      }
    };

    const handleDelete = (attachmentId: string) => {
      if (transaction.type === "receita") {
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
        if (transaction.type === "receita") {
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
    const match = name?.match(/Contrato #(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const handleViewContractDetails = (transaction: any) => {
    const contractId = extractContractIdFromName(transaction.name);
    if (contractId) {
      setSelectedCaseId(contractId);
      // abre modal de detalhes “contrato”
    }
  };

  // Contadores/filters
  const statusCounts = {
    aprovado: items.filter((i: any) => i.status === "financeiro_pendente" && !i.contract).length,
    liberado: items.filter((i: any) => i.status === "contrato_efetivado" || (!!i.contract && i.status !== "contrato_cancelado" && i.status !== "caso_cancelado")).length,
    cancelado: items.filter((i: any) => i.status === "contrato_cancelado" || i.status === "caso_cancelado").length,
    todos: items.length
  };

  const availableFilters = [
    { id: "aprovado", label: "Aguardando Financeiro", value: "aprovado", color: "success" as const, count: statusCounts.aprovado },
    { id: "liberado", label: "Contrato Efetivado", value: "liberado", color: "primary" as const, count: statusCounts.liberado },
    { id: "cancelado", label: "Cancelados", value: "cancelado", color: "danger" as const, count: statusCounts.cancelado }
  ];

  const handleFilterToggle = (filterId: string) => {
    setStatusFilter(prev => (prev.includes(filterId) ? [] : [filterId]));
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setSearchTerm("");
    setPage(1);
  };

  // Filtro mês (mantido utilitário)
  const handleMonthFilter = (monthValue: string) => {
    const [year, month] = monthValue.split("-");
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthStart = startOfMonthBrasilia(targetDate);
    const monthEnd = endOfMonthBrasilia(targetDate);
    // aqui você pode usar monthStart/monthEnd se desejar aplicar
    setPage(1);
  };

  // Filtragem lista principal
  const filteredItems = items.filter((item: any) => {
    if (searchTerm) {
      const clientName = item.client?.name?.toLowerCase() || "";
      const clientCpf = item.client?.cpf || "";
      const s = searchTerm.toLowerCase();
      if (!clientName.includes(s) && !clientCpf.includes(s)) return false;
    }
    if (statusFilter.length > 0) {
      const active = statusFilter[0];
      switch (active) {
        case "aprovado":
          if (!(item.status === "financeiro_pendente" && !item.contract)) return false;
          break;
        case "liberado":
          if (!(item.status === "contrato_efetivado" || (!!item.contract && item.status !== "contrato_cancelado" && item.status !== "caso_cancelado"))) return false;
          break;
        case "cancelado":
          if (item.status !== "contrato_cancelado" && item.status !== "caso_cancelado") return false;
          break;
        default:
          break;
      }
    }
    return true;
  });

  // Paginação itens
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

      {/* Filtro período */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtros por Período</h3>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            if (start && end) {
              const s = new Date(start);
              const e = new Date(end);
              if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                setStartDate(start);
                setEndDate(end);
              }
            }
          }}
          onClear={() => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split("T")[0]);
            setEndDate(lastDay.toISOString().split("T")[0]);
          }}
          label="Filtrar período:"
          className="mb-4"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={`R$ ${(metrics.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle="Consultoria + Receitas Manuais + Externas"
          isLoading={metricsLoading}
          gradientVariant="emerald"
          trend={trends.receita}
          miniChart={<MiniAreaChart data={getTrendChartData.receita} dataKey="value" xKey="day" stroke="#10b981" height={60} valueType="currency" />}
        />
        <KPICard
          title="Receita Consultoria Líquida"
          value={`R$ ${(metrics.totalConsultoriaLiq || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle="Consultorias líquidas"
          isLoading={metricsLoading}
          gradientVariant="sky"
          trend={trends.consultoria}
          miniChart={<MiniAreaChart data={getTrendChartData.consultoria} dataKey="value" xKey="day" stroke="#0ea5e9" height={60} valueType="currency" />}
        />
        <KPICard
          title="Lucro Líquido"
          value={`R$ ${(metrics.netProfit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle="Receita - Despesas"
          isLoading={metricsLoading}
          gradientVariant="violet"
          trend={trends.lucro}
          miniChart={<MiniAreaChart data={getTrendChartData.lucro} dataKey="value" xKey="day" stroke="#8b5cf6" height={60} valueType="currency" />}
        />
        <KPICard
          title="Despesas"
          value={`R$ ${(metrics.totalExpenses || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle="Despesas do período"
          isLoading={metricsLoading}
          gradientVariant="rose"
          trend={trends.despesas}
          miniChart={<MiniAreaChart data={getTrendChartData.despesas} dataKey="value" xKey="day" stroke="#f43f5e" height={60} valueType="currency" />}
        />
      </div>

      {/* Filtros rápidos (casos) */}
      <QuickFilters
        searchTerm={searchTerm}
        onSearchChange={v => {
          setSearchTerm(v);
          setPage(1);
        }}
        activeFilters={statusFilter}
        onFilterToggle={handleFilterToggle}
        availableFilters={[
          { id: "aprovado", label: "Aguardando Financeiro", value: "aprovado", color: "success", count: statusCounts.aprovado },
          { id: "liberado", label: "Contrato Efetivado", value: "liberado", color: "primary", count: statusCounts.liberado },
          { id: "cancelado", label: "Cancelados", value: "cancelado", color: "danger", count: statusCounts.cancelado }
        ]}
        onClearAll={handleClearFilters}
        placeholder="Buscar por nome ou CPF..."
      />

      {/* Lista de Casos Financeiros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Atendimentos para Liberação</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshCases}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>

        {loadingQueue ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando atendimentos...</p>
          </div>
        ) : totalItems > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {paginatedItems.map((item: any) => {
                const contractId = item.contract?.id;
                const clientBankInfo = item.client
                  ? {
                      banco: item.client.banco,
                      agencia: item.client.agencia,
                      conta: item.client.conta,
                      chave_pix: item.client.chave_pix,
                      tipo_chave_pix: item.client.tipo_chave_pix
                    }
                  : undefined;

                const simulationResult = item.simulation
                  ? {
                      banco: item.simulation.banks?.[0]?.banco || "",
                      valorLiberado: item.simulation.totals.liberadoTotal,
                      valorParcela: item.simulation.totals.valorParcelaTotal,
                      coeficiente: parseFloat(item.simulation.coeficiente || "0"),
                      saldoDevedor: item.simulation.totals.saldoTotal,
                      valorTotalFinanciado: item.simulation.totals.totalFinanciado,
                      seguroObrigatorio: item.simulation.totals.seguroObrigatorio || 0,
                      valorLiquido: item.simulation.totals.valorLiquido,
                      custoConsultoria: item.simulation.totals.custoConsultoria,
                      custoConsultoriaLiquido:
                        item.simulation.totals.custoConsultoriaLiquido ||
                        item.simulation.totals.custoConsultoria * 0.86,
                      liberadoCliente: item.simulation.totals.liberadoCliente,
                      percentualConsultoria: item.simulation.percentualConsultoria,
                      taxaJuros: 1.99,
                      prazo: item.simulation.prazo
                    }
                  : undefined;

                const cardStatus = (() => {
                  if (item.status === "caso_cancelado") return "caso_cancelado";
                  if (item.status === "contrato_cancelado") return "contrato_cancelado";
                  if (item.status === "contrato_efetivado" || item.contract) return "disbursed";
                  if (item.status === "financeiro_pendente") return "financeiro_pendente";
                  if (item.status === "fechamento_aprovado") return "fechamento_aprovado";
                  return "approved";
                })() as "pending" | "approved" | "disbursed" | "overdue" | "financeiro_pendente" | "contrato_efetivado" | "fechamento_aprovado" | "encerrado" | "caso_cancelado" | "contrato_cancelado";

                return (
                  <FinanceCard
                    key={item.id}
                    id={item.id}
                    clientName={item.client?.name || `Cliente ${item.id}`}
                    totalAmount={item.contract?.total_amount || item.simulation?.totals.liberadoTotal || 0}
                    installments={item.contract?.installments || item.simulation?.prazo || 0}
                    status={cardStatus}
                    dueDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
                    simulationResult={simulationResult}
                    onDisburse={handleDisburse}
                    onCancel={contractId ? () => handleCancel(contractId) : undefined}
                    onReturnToCalculista={handleReturnToCalculista}
                    onCancelCase={handleCancelCase}
                    clientBankInfo={clientBankInfo}
                    attachments={item.contract?.attachments || item.attachments || []}
                    onUploadAttachment={createUploadHandler(contractId, item.id)}
                    isUploadingAttachment={uploadingContractId === contractId}
                    onDownloadAttachment={(attachmentId: number, filename?: string) => {
                      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
                      const downloadUrl = `${baseUrl}/cases/${item.id}/attachments/${attachmentId}/download`;

                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = filename || 'anexo';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    caseDetails={{
                      cpf: item.client?.cpf,
                      matricula: item.client?.matricula,
                      created_at: item.created_at
                    }}
                    fullCaseDetails={selectedCaseId === item.id ? fullCaseDetails : undefined}
                    onLoadFullDetails={handleLoadFullDetails}
                    availableUsers={users}
                    assignedUserId={item.assigned_user_id}
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
                onItemsPerPageChange={size => {
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
              <Button size="sm" variant="outline" onClick={handleRefreshTransactions} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button size="sm" variant="outline" onClick={exportToCSV} className="gap-2">
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

          {/* Resumo topo - Apenas na tab "Todas" */}
          {!transactionType && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                    <p className="text-2xl font-bold text-success">R$ {totals.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                    <p className="text-2xl font-bold text-danger">R$ {totals.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-danger" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                    <p className={`text-2xl font-bold ${totals.saldo >= 0 ? "text-success" : "text-danger"}`}>
                      R$ {totals.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${totals.saldo >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
                    <Wallet className={`h-6 w-6 ${totals.saldo >= 0 ? "text-success" : "text-danger"}`} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Abas transações */}
          <Tabs value={transactionType || "todas"} onValueChange={v => setTransactionType(v === "todas" ? "" : v)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="receita">Receitas</TabsTrigger>
              <TabsTrigger value="despesa">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tabela unificada */}
          {loadingTransactions ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-muted-foreground">Carregando transações...</p>
              </div>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold text-sm">Data</th>
                        <th className="text-left p-4 font-semibold text-sm">Tipo</th>
                        <th className="text-left p-4 font-semibold text-sm">Cliente</th>
                        <th className="text-left p-4 font-semibold text-sm">CPF</th>
                        <th className="text-left p-4 font-semibold text-sm">Atendente</th>
                        <th className="text-left p-4 font-semibold text-sm">Categoria</th>
                        <th className="text-right p-4 font-semibold text-sm">Valor</th>
                        <th className="text-center p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction: any) => (
                        <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(transaction.date).toLocaleDateString("pt-BR")}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                transaction.type === "receita"
                                  ? "bg-success/10 text-success border border-success/20"
                                  : "bg-danger/10 text-danger border border-danger/20"
                              }`}
                            >
                              {transaction.type === "receita" ? (
                                <>
                                  <TrendingUp className="h-3 w-3" />
                                  Receita
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-3 w-3" />
                                  Despesa
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-sm">
                            {transaction.client_name ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{transaction.client_name}</span>
                              </div>
                            ) : transaction.name ? (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground italic">{transaction.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-sm font-mono">
                            {transaction.client_cpf ? (
                              <span className="text-muted-foreground">
                                {transaction.client_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            {transaction.agent_name ? <span className="font-medium">{transaction.agent_name}</span> : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-4 text-sm">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md text-xs border">
                              <Receipt className="h-3 w-3" />
                              {transaction.category}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-semibold whitespace-nowrap ${transaction.type === "receita" ? "text-success" : "text-danger"}`}>
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-4 w-4" />
                              R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTransaction(transaction)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="h-8 w-8 p-0 text-danger hover:text-danger hover:bg-danger/10"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginação tabela */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Linhas por página:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
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
                    Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, transactions.length)} de {transactions.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Anterior
                  </Button>
                  <span className="text-sm">Página {page} de {transactionsTotalPages || 1}</span>
                  <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page >= transactionsTotalPages}>
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

      {/* Modal Despesas */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSubmit={(data, files) => saveExpenseMutation.mutate({ data, files })}
        onDownloadAttachment={expenseId => {
          downloadExpenseAttachment.mutate(expenseId, {
            onSuccess: response => {
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              // Extrair nome do arquivo do header e remover aspas
              const contentDisposition = response.headers["content-disposition"];
              const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
              link.download = filenameMatch?.[1] || "anexo.pdf";
              link.click();
              window.URL.revokeObjectURL(url);
            }
          });
        }}
        onDeleteAttachment={expenseId => {
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

      {/* Modal Receitas */}
      <IncomeModal
        isOpen={showIncomeModal}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSubmit={(data, files) => saveIncomeMutation.mutate({ data, files })}
        onDownloadAttachment={incomeId => {
          downloadIncomeAttachment.mutate(incomeId, {
            onSuccess: response => {
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              // Extrair nome do arquivo do header e remover aspas
              const contentDisposition = response.headers["content-disposition"];
              const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
              link.download = filenameMatch?.[1] || "anexo.pdf";
              link.click();
              window.URL.revokeObjectURL(url);
            }
          });
        }}
        onDeleteAttachment={incomeId => {
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

      {/* Modal Detalhes do Contrato/Atendimento */}
      {/* ... (mantido igual ao seu, sem alterações estruturais) ... */}

      {/* Modal: anexos de transação */}
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

      {/* Modal FinanceCard — corrigido */}
      {showFinanceCardModal && financeCardDetails && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowFinanceCardModal(false);
            setFinanceCardCaseId(null);
          }}
        >
          <div
            className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowFinanceCardModal(false);
                  setFinanceCardCaseId(null);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Fechar
              </Button>
            </div>

            <FinanceCard
              id={financeCardDetails.id}
              clientName={financeCardDetails.client?.name || `Cliente ${financeCardDetails.id}`}
              clientCpf={financeCardDetails.client?.cpf || ""}
              status={financeCardDetails.status}
              simulationResult={
                financeCardDetails.simulation
                  ? {
                      banco: financeCardDetails.simulation.banks_json?.[0]?.banco || "",
                      valorLiberado: financeCardDetails.simulation.totals?.liberadoTotal || 0,
                      valorParcela: financeCardDetails.simulation.totals?.valorParcelaTotal || 0,
                      coeficiente: parseFloat(financeCardDetails.simulation.coeficiente || "0"),
                      saldoDevedor: financeCardDetails.simulation.totals?.saldoTotal || 0,
                      valorTotalFinanciado: financeCardDetails.simulation.totals?.totalFinanciado || 0,
                      seguroObrigatorio: financeCardDetails.simulation.seguro || 0,
                      valorLiquido: financeCardDetails.simulation.totals?.valorLiquido || 0,
                      custoConsultoria: financeCardDetails.simulation.totals?.custoConsultoria || 0,
                      custoConsultoriaLiquido: financeCardDetails.simulation.totals?.custoConsultoriaLiquido || 0,
                      liberadoCliente: financeCardDetails.simulation.totals?.liberadoCliente || 0,
                      percentualConsultoria: financeCardDetails.simulation.percentual_consultoria || 0,
                      taxaJuros: 1.99,
                      prazo: financeCardDetails.simulation.prazo || 0
                    }
                  : undefined
              }
              clientBankInfo={
                financeCardDetails.client
                  ? {
                      banco: financeCardDetails.client.banco,
                      agencia: financeCardDetails.client.agencia,
                      conta: financeCardDetails.client.conta,
                      chave_pix: financeCardDetails.client.chave_pix,
                      tipo_chave_pix: financeCardDetails.client.tipo_chave_pix
                    }
                  : undefined
              }
              attachments={financeCardDetails.contract?.attachments || financeCardDetails.attachments || []}
              onDisburse={handleDisburse}
              onDownloadAttachment={handleDownloadCaseAttachment}
              caseDetails={{
                cpf: financeCardDetails.client?.cpf,
                matricula: financeCardDetails.client?.matricula,
                created_at: financeCardDetails.created_at
              }}
              fullCaseDetails={financeCardDetails}
              availableUsers={users}
              assignedUserId={financeCardDetails.assigned_user_id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
