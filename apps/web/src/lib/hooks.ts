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
  return useQuery({ queryKey:["finance","queue"], queryFn: async ()=> (await api.get("/finance/queue")).data.items ?? [] });
}
export function useFinanceDisburse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload:{case_id:number; total_amount:number; installments:number; disbursed_at?:string}) =>
      (await api.post("/finance/disburse", payload)).data,
    onSuccess: ()=> {
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
      qc.invalidateQueries({ queryKey: ['finance', 'queue'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
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
      qc.invalidateQueries({ queryKey: ['finance', 'queue'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/** Contratos */
export function useContracts() {
  return useQuery({ queryKey:["contracts"], queryFn: async ()=> (await api.get("/contracts")).data.items ?? [] });
}

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

/** Dashboard */
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
    refetchInterval: 30000 // Atualiza a cada 30 segundos
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
