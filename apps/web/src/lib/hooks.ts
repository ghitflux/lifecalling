import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "./api";
import type { Case, CaseDetail } from "@/types";

export function useCases(params?: { status?: string; mine?: boolean; q?: string; }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.mine) sp.set("mine", "true");
  if (params?.q) sp.set("q", params.q);
  return useQuery({
    queryKey: ["cases", params],
    queryFn: async () => (await API.get<{items: Case[]}>(`/cases?${sp.toString()}`)).data.items
  });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: async () => (await API.get<CaseDetail>(`/cases/${id}`)).data
  });
}

export function useAssignCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await API.post(`/cases/${id}/assign`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] })
  });
}

export function usePatchCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}:{id:number, data:Partial<{telefone_preferencial:string; observacoes:string}>}) =>
      (await API.patch(`/cases/${id}`, data)).data,
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
      return (await API.post(`/cases/${caseId}/attachments`, form, {
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
    mutationFn: async (caseId:number)=> (await API.post(`/cases/${caseId}/to-calculista`)).data,
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
    queryFn: async ()=> (await API.get<{items:any[]}>(`/simulations?status=${status}`)).data.items
  });
}

export function useSimApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({simId, payload}:{simId:number, payload:{manual_input:any, results:any}})=>
      (await API.post(`/simulations/${simId}/approve`, payload)).data,
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
      (await API.post(`/simulations/${simId}/reject`, payload)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["sims","pending"]});
      qc.invalidateQueries({queryKey:["cases"]});
    }
  });
}

/** Fechamento */
export function useClosingQueue() {
  return useQuery({ queryKey:["closing","queue"], queryFn: async ()=> (await API.get("/closing/queue")).data.items ?? [] });
}
export function useClosingApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId:number)=> (await API.post("/closing/approve",{case_id: caseId})).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:["closing","queue"]}); qc.invalidateQueries({queryKey:["cases"]}); }
  });
}
export function useClosingReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId:number)=> (await API.post("/closing/reject",{case_id: caseId})).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:["closing","queue"]}); qc.invalidateQueries({queryKey:["cases"]}); }
  });
}

/** Financeiro */
export function useFinanceQueue() {
  return useQuery({ queryKey:["finance","queue"], queryFn: async ()=> (await API.get("/finance/queue")).data.items ?? [] });
}
export function useFinanceDisburse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload:{case_id:number; total_amount:number; installments:number; disbursed_at?:string}) =>
      (await API.post("/finance/disburse", payload)).data,
    onSuccess: ()=> {
      qc.invalidateQueries({queryKey:["finance","queue"]});
      qc.invalidateQueries({queryKey:["contracts"]});
      qc.invalidateQueries({queryKey:["cases"]});
    }
  });
}

/** Contratos */
export function useContracts() {
  return useQuery({ queryKey:["contracts"], queryFn: async ()=> (await API.get("/contracts")).data.items ?? [] });
}
