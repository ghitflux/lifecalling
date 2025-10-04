import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Case, CaseDetail } from "@/types";
import { toast } from "sonner";

export function useCases(params?: { status?: string; mine?: boolean; q?: string; }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.mine) sp.set("mine", "true");
  if (params?.q) sp.set("q", params.q);
  return useQuery({
    queryKey: ["cases", params],
    queryFn: async () => (await api.get<{items: Case[]}>(`/cases?${sp.toString()}`)).data.items
  });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: async () => (await api.get<CaseDetail>(`/cases/${id}`)).data
  });
}

export function useAssignCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.post(`/cases/${id}/assign`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] })
  });
}

export function usePatchCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}:{id:number, data:Partial<{telefone_preferencial:string; observacoes:string}>}) =>
      (await api.patch(`/cases/${id}`, data)).data,
    onSuccess: (_,vars) => {
      qc.invalidateQueries({ queryKey: ["case", vars.id] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    }
  });
}

export function useAttachments(caseId: number) {
  return useQuery({
    queryKey: ["case", caseId, "attachments"],
    queryFn: async () => (await api.get(`/cases/${caseId}/attachments`)).data.items ?? [],
    enabled: !!caseId
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, attachmentId }: { caseId: number; attachmentId: number }) =>
      (await api.delete(`/cases/${caseId}/attachments/${attachmentId}`)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["case", vars.caseId, "attachments"] });
      qc.invalidateQueries({ queryKey: ["case", vars.caseId] });
      toast.success("Anexo removido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao remover anexo");
    }
  });
}

/** Histórico de telefones do cliente */
export function useClientPhones(clientId: number) {
  return useQuery({
    queryKey: ["client", clientId, "phones"],
    queryFn: async () => (await api.get(`/clients/${clientId}/phones`)).data?.items ?? [],
    enabled: !!clientId && clientId > 0
  });
}

export function useAddClientPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, phone, isPrimary }: { clientId: number; phone: string; isPrimary?: boolean }) =>
      (await api.post(`/clients/${clientId}/phones`, { phone, is_primary: isPrimary })).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["client", vars.clientId, "phones"] });
      qc.invalidateQueries({ queryKey: ["case"] });
      toast.success("Telefone registrado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao registrar telefone");
    }
  });
}

export function useDeleteClientPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, phoneId }: { clientId: number; phoneId: number }) =>
      (await api.delete(`/clients/${clientId}/phones/${phoneId}`)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["client", vars.clientId, "phones"] });
      toast.success("Telefone removido do histórico");
    },
    onError: () => {
      toast.error("Erro ao remover telefone");
    }
  });
}

/** Histórico de eventos do caso */
export function useCaseEvents(caseId: number) {
  return useQuery({
    queryKey: ["case", caseId, "events"],
    queryFn: async () => (await api.get(`/cases/${caseId}/events`)).data.events ?? [],
    enabled: !!caseId,
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });
}

export function useUploadAttachment(caseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/cases/${caseId}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["case", caseId, "attachments"] });
    },
  });
}

export function useSendToCalculista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId:number)=> (await api.post(`/cases/${caseId}/to-calculista`)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["cases"]});
    },
    onError: (error) => {
      console.error("Erro ao enviar para calculista:", error);
    }
  });
}

export function useMarkNoContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: number) => (await api.post(`/cases/${caseId}/mark-no-contact`)).data,
    onSuccess: (_, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["case", caseId, "events"] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Marcado como sem contato");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao marcar sem contato");
    }
  });
}

export function useSendToFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: number) => (await api.post(`/cases/${caseId}/to-fechamento`)).data,
    onSuccess: (_, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso enviado para fechamento com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao enviar para fechamento");
    }
  });
}

export function useReassignCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({caseId, assigneeId}:{caseId:number, assigneeId:number})=>
      (await api.patch(`/cases/${caseId}/assignee`, {assignee_id: assigneeId})).data,
    onSuccess: (_, vars)=> {
      qc.invalidateQueries({queryKey:["case", vars.caseId]});
      qc.invalidateQueries({queryKey:["cases"]});
      toast.success("Caso reatribuído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao reatribuir caso");
    }
  });
}

export function useUsers(role?: string) {
  const sp = new URLSearchParams();
  if (role) sp.set("role", role);
  return useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      const response = await api.get<Array<{id:number, name:string, email:string, role:string, active:boolean}>>(`/users?${sp.toString()}`);
      // Backend retorna array diretamente, não um objeto com items
      return response.data;
    }
  });
}

// Bulk delete hooks
export function useBulkDeleteCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => (await api.post('/cases/bulk-delete', { ids })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      if (data.success_count > 0) {
        toast.success(`${data.success_count} caso(s) excluído(s) com sucesso`);
      }
      if (data.failed_count > 0) {
        toast.error(`${data.failed_count} caso(s) falharam ao excluir`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir casos");
    }
  });
}

export function useBulkDeleteClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => (await api.post('/clients/bulk-delete', { ids })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      if (data.success_count > 0) {
        toast.success(`${data.success_count} cliente(s) excluído(s) com sucesso`);
      }
      if (data.failed_count > 0) {
        toast.error(`${data.failed_count} cliente(s) falharam ao excluir`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir clientes");
    }
  });
}

export function useBulkDeleteUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => (await api.post('/users/bulk-delete', { ids })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      if (data.success_count > 0) {
        toast.success(`${data.success_count} usuário(s) excluído(s) com sucesso`);
      }
      if (data.failed_count > 0) {
        toast.error(`${data.failed_count} usuário(s) falharam ao excluir`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir usuários");
    }
  });
}

export function useSims(status: "pending"|"approved"|"rejected"="pending") {
  return useQuery({
    queryKey: ["sims", status],
    queryFn: async ()=> (await api.get<{items:any[]}>(`/simulations?status=${status}`)).data.items
  });
}

export function useSimApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({simId, payload}:{simId:number, payload:{manual_input:any, results:any}})=>
      (await api.post(`/simulations/${simId}/approve`, payload)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["sims","pending"]});
      qc.invalidateQueries({queryKey:["cases"]});
    }
  });
}

export function useSimReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({simId, payload}:{simId:number, payload:{manual_input:any, results:any}})=>
      (await api.post(`/simulations/${simId}/reject`, payload)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["sims","pending"]});
      qc.invalidateQueries({queryKey:["cases"]});
    }
  });
}

/** Fechamento */
export function useClosingQueue() {
  return useQuery({ queryKey:["closing","queue"], queryFn: async ()=> (await api.get("/closing/queue")).data.items ?? [] });
}
export function useClosingApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId:number)=> (await api.post("/closing/approve",{case_id: caseId})).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:["closing","queue"]}); qc.invalidateQueries({queryKey:["cases"]}); }
  });
}
export function useClosingReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId:number)=> (await api.post("/closing/reject",{case_id: caseId})).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:["closing","queue"]}); qc.invalidateQueries({queryKey:["cases"]}); }
  });
}

/** Financeiro */
export function useFinanceQueue() {
  return useQuery({
    queryKey: ["financeQueue"],
    queryFn: async () => {
      const response = await api.get("/finance/queue");
      return response.data.items ?? [];
    }
  });
}
export function useFinanceDisburse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload:{case_id:number; total_amount:number; installments:number; disbursed_at?:string}) =>
      (await api.post("/finance/disburse", payload)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({ queryKey: ["financeQueue"] });
      qc.invalidateQueries({queryKey:["finance","queue"]});
      qc.invalidateQueries({queryKey:["contracts"]});
      qc.invalidateQueries({queryKey:["cases"]});
    }
  });
}

export function useFinanceDisburseSimple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post('/finance/disburse-simple', { case_id: caseId });
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.invalidateQueries({ queryKey: ['financeQueue'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error: any) => {
      console.error('Erro ao efetivar liberação:', error);
      toast.error(error.response?.data?.detail || "Erro ao efetivar liberação");
    }
  });
}

export function useCancelContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: number) => {
      const response = await api.post(`/finance/cancel/${contractId}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeQueue'] });
      qc.invalidateQueries({ queryKey: ['finance', 'queue'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: number) => {
      const response = await api.delete(`/finance/delete/${contractId}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeQueue'] });
      qc.invalidateQueries({ queryKey: ['finance', 'queue'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useReturnToCalculista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: number) => {
      const response = await api.post(`/cases/${caseId}/return-to-calculista`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeQueue'] });
      qc.invalidateQueries({ queryKey: ['finance', 'queue'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/** Contratos */
export function useContractAttachments(contractId: number) {
  return useQuery({
    queryKey: ["contract", contractId, "attachments"],
    queryFn: async () => (await api.get(`/contracts/${contractId}/attachments`)).data.items ?? [],
    enabled: !!contractId
  });
}

export function useUploadContractAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contractId, file }: { contractId: number; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post(`/contracts/${contractId}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })).data;
    },
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ["contract", contractId, "attachments"] });
      qc.invalidateQueries({ queryKey: ["financeQueue"] });
      qc.invalidateQueries({ queryKey: ["finance", "queue"] }); // Invalidar também a queue do financeiro
    },
  });
}

export function useDeleteContractAttachment(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: number) =>
      (await api.delete(`/contracts/${contractId}/attachments/${attachmentId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract", contractId, "attachments"] });
      qc.invalidateQueries({ queryKey: ["financeQueue"] });
      qc.invalidateQueries({ queryKey: ["finance", "queue"] });
    },
  });
}

/** Métricas */
export function useFinanceMetrics() {
  return useQuery({
    queryKey:["finance","metrics"],
    queryFn: async ()=> (await api.get("/finance/metrics")).data,
    refetchInterval: 60000 // Refetch a cada minuto
  });
}

/** Receitas Manuais */
export function useFinanceIncomes() {
  return useQuery({
    queryKey:["finance","incomes"],
    queryFn: async ()=> (await api.get("/finance/incomes")).data.items ?? []
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {date?: string; amount: number; description?: string}) =>
      (await api.post("/finance/incomes", data)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
      qc.invalidateQueries({queryKey:["finance","metrics"]});
    }
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: number; data: {date?: string; amount: number; description?: string}}) =>
      (await api.put(`/finance/incomes/${id}`, data)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
      qc.invalidateQueries({queryKey:["finance","metrics"]});
    }
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/finance/incomes/${id}`)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
      qc.invalidateQueries({queryKey:["finance","metrics"]});
    }
  });
}

/** Upload de anexo para receita (arquivo único) */
export function useUploadIncomeAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({incomeId, file}: {incomeId: number; file: File}) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/finance/incomes/${incomeId}/attachment`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
    }
  });
}

/** Upload de múltiplos anexos para receita */
export function useUploadIncomeAttachments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({incomeId, files}: {incomeId: number; files: File[]}) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return (await api.post(`/finance/incomes/${incomeId}/attachments`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
    }
  });
}

/** Buscar anexos de receita */
export function useIncomeAttachments(incomeId: number) {
  return useQuery({
    queryKey: ["finance", "incomes", incomeId, "attachments"],
    queryFn: async () => (await api.get(`/finance/incomes/${incomeId}/attachments`)).data,
    enabled: !!incomeId
  });
}

/** Download de anexo de receita */
export function useDownloadIncomeAttachment() {
  return useMutation({
    mutationFn: async (incomeId: number) => {
      const response = await api.get(`/finance/incomes/${incomeId}/attachment`, {
        responseType: 'blob'
      });
      return response;
    }
  });
}

/** Delete de anexo de receita */
export function useDeleteIncomeAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (incomeId: number) =>
      (await api.delete(`/finance/incomes/${incomeId}/attachment`)).data,
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","incomes"]});
    }
  });
}

/** Upload de anexo para despesa (arquivo único) */
export function useUploadExpenseAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({expenseId, file}: {expenseId: number; file: File}) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/finance/expenses/${expenseId}/attachment`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","expenses"]});
    }
  });
}

/** Upload de múltiplos anexos para despesa */
export function useUploadExpenseAttachments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({expenseId, files}: {expenseId: number; files: File[]}) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return (await api.post(`/finance/expenses/${expenseId}/attachments`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","expenses"]});
    }
  });
}

/** Buscar anexos de despesa */
export function useExpenseAttachments(expenseId: number) {
  return useQuery({
    queryKey: ["finance", "expenses", expenseId, "attachments"],
    queryFn: async () => (await api.get(`/finance/expenses/${expenseId}/attachments`)).data,
    enabled: !!expenseId
  });
}

/** Download de anexo de despesa */
export function useDownloadExpenseAttachment() {
  return useMutation({
    mutationFn: async (expenseId: number) => {
      const response = await api.get(`/finance/expenses/${expenseId}/attachment`, {
        responseType: 'blob'
      });
      return response;
    }
  });
}

/** Delete de anexo de despesa */
export function useDeleteExpenseAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: number) =>
      (await api.delete(`/finance/expenses/${expenseId}/attachment`)).data,
    onSuccess: () => {
      qc.invalidateQueries({queryKey:["finance","expenses"]});
    }
  });
}

/** Detalhes do Caso Financeiro */
export function useFinanceCaseDetails(caseId: number) {
  return useQuery({
    queryKey:["finance","case", caseId],
    queryFn: async ()=> (await api.get(`/finance/case/${caseId}`)).data,
    enabled: !!caseId
  });
}

/** Detalhes do Caso Fechamento */
export function useClosingCaseDetails(caseId: number) {
  return useQuery({
    queryKey:["closing","case", caseId],
    queryFn: async ()=> (await api.get(`/closing/case/${caseId}`)).data,
    enabled: !!caseId
  });
}

/** Séries Temporais para Gráficos */
export function useFinanceTimeseries() {
  return useQuery({
    queryKey:["finance","timeseries"],
    queryFn: async ()=> (await api.get("/finance/timeseries")).data,
    refetchInterval: 60000
  });
}

/** Analytics Dashboard */
export type AnalyticsRange = {
  from?: string;
  to?: string;
};

type AnalyticsBucket = "day" | "week" | "month";

const ANALYTICS_STALE_TIME = 60_000;

const buildAnalyticsParams = (range?: AnalyticsRange) => {
  const params: Record<string, string> = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;
  return params;
};

export function useAnalyticsKpis(range?: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "kpis", range?.from ?? null, range?.to ?? null],
    queryFn: async () => (await api.get("/analytics/kpis", { params: buildAnalyticsParams(range) })).data,
    staleTime: ANALYTICS_STALE_TIME,
    enabled: Boolean(range?.from && range?.to),
  });
}

export function useAnalyticsSeries(range: AnalyticsRange | undefined, bucket: AnalyticsBucket) {
  return useQuery({
    queryKey: ["analytics", "series", range?.from ?? null, range?.to ?? null, bucket],
    queryFn: async () => {
      const params = buildAnalyticsParams(range);
      params.bucket = bucket;
      return (await api.get("/analytics/series", { params })).data;
    },
    staleTime: ANALYTICS_STALE_TIME,
    enabled: Boolean(range?.from && range?.to),
  });
}

export function useAnalyticsFunnel(range?: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "funnel", range?.from ?? null, range?.to ?? null],
    queryFn: async () => (await api.get("/analytics/funnel", { params: buildAnalyticsParams(range) })).data,
    staleTime: ANALYTICS_STALE_TIME,
    enabled: Boolean(range?.from && range?.to),
  });
}

export function useAnalyticsModules(range: AnalyticsRange | undefined, bucket: AnalyticsBucket) {
  return useQuery({
    queryKey: ["analytics", "modules", range?.from ?? null, range?.to ?? null, bucket],
    queryFn: async () => {
      const params = buildAnalyticsParams(range);
      params.bucket = bucket;
      return (await api.get("/analytics/by-module", { params })).data;
    },
    staleTime: ANALYTICS_STALE_TIME,
    enabled: Boolean(range?.from && range?.to),
  });
}

export function useAnalyticsHealth() {
  return useQuery({
    queryKey: ["analytics", "health"],
    queryFn: async () => (await api.get("/analytics/health")).data,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}


/** Dashboard (legacy) */
export function useDashboardStats() {
  return useQuery({
    queryKey:["dashboard","stats"],
    queryFn: async ()=> (await api.get("/dashboard/stats")).data,
    refetchInterval: 30000
  });
}

export function useDashboardStatusBreakdown() {
  return useQuery({
    queryKey:["dashboard","status-breakdown"],
    queryFn: async ()=> (await api.get("/dashboard/status-breakdown")).data,
    refetchInterval: 30000
  });
}

export function useDashboardPerformance() {
  return useQuery({
    queryKey:["dashboard","daily-performance"],
    queryFn: async ()=> (await api.get("/dashboard/daily-performance")).data,
    refetchInterval: 30000
  });
}

export function useDashboardChartData(period: string = "6m") {
  return useQuery({
    queryKey:["dashboard","chart-data", period],
    queryFn: async ()=> (await api.get(`/dashboard/chart-data?period=${period}`)).data,
    refetchInterval: 60000
  });
}

export function useDashboardUserPerformance() {
  return useQuery({
    queryKey:["dashboard","user-performance"],
    queryFn: async ()=> (await api.get("/dashboard/user-performance")).data,
    refetchInterval: 60000
  });
}

export function useDashboardMonthlyTrends() {
  return useQuery({
    queryKey:["dashboard","monthly-trends"],
    queryFn: async ()=> (await api.get("/dashboard/monthly-trends")).data,
    refetchInterval: 60000
  });
}

export function useMyStats() {
  return useQuery({
    queryKey:["dashboard","my-stats"],
    queryFn: async ()=> (await api.get("/dashboard/my-stats")).data,
    refetchInterval: 30000
  });
}

/** Notificações */
export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey:["notifications", unreadOnly],
    queryFn: async ()=> (await api.get(`/notifications?unread_only=${unreadOnly}`)).data.items ?? [],
    refetchInterval: 30000 // 30 segundos
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey:["notifications","unread-count"],
    queryFn: async ()=> (await api.get("/notifications/unread-count")).data.count ?? 0,
    refetchInterval: 15000 // 15 segundos
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) =>
      (await api.post(`/notifications/${notificationId}/mark-read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/notifications/mark-all-read")).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}
