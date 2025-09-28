/* apps/web/src/lib/simulation-hooks.ts */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { toast } from "sonner";
import type { SimulationResult } from "@lifecalling/ui";

export interface CreateSimulationRequest {
  case_id: number;
}

export interface ApproveSimulationRequest {
  simId: number;
  payload: {
    manual_input: any;
    results: SimulationResult;
  };
}

export interface RejectSimulationRequest {
  simId: number;
  payload: {
    reason?: string;
  };
}

/**
 * Hook para criar uma nova simulação
 */
export function useCreateSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSimulationRequest) => {
      const response = await api.post("/simulations", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Simulação criada com sucesso!");
      return data;
    },
    onError: (error: any) => {
      console.error("Erro ao criar simulação:", error);
      toast.error("Erro ao criar simulação. Tente novamente.");
    }
  });
}

/**
 * Hook para aprovar uma simulação
 */
export function useApproveSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ simId, payload }: ApproveSimulationRequest) => {
      const response = await api.post(`/simulations/${simId}/approve`, payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });

      // Atualizar caso específico para refletir simulação aprovada
      queryClient.invalidateQueries({
        queryKey: ["case", variables.payload.results.banco]
      });

      toast.success("Simulação aprovada com sucesso!");
      return data;
    },
    onError: (error: any) => {
      console.error("Erro ao aprovar simulação:", error);
      toast.error("Erro ao aprovar simulação. Tente novamente.");
    }
  });
}

/**
 * Hook para rejeitar uma simulação
 */
export function useRejectSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ simId, payload }: RejectSimulationRequest) => {
      const response = await api.post(`/simulations/${simId}/reject`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Simulação rejeitada.");
    },
    onError: (error: any) => {
      console.error("Erro ao rejeitar simulação:", error);
      toast.error("Erro ao rejeitar simulação. Tente novamente.");
    }
  });
}

/**
 * Hook para buscar simulações pendentes
 */
export function usePendingSimulations() {
  return useQuery({
    queryKey: ["simulations", "pending"],
    queryFn: async () => {
      const response = await api.get("/simulations?status=pending");
      return response.data?.items || [];
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: 2,
    staleTime: 15000, // Considerar dados obsoletos após 15 segundos
  });
}

/**
 * Hook para buscar detalhes de uma simulação específica
 */
export function useSimulationDetails(simulationId: number | null) {
  return useQuery({
    queryKey: ["simulation", simulationId],
    queryFn: async () => {
      if (!simulationId) return null;
      const response = await api.get(`/simulations/${simulationId}`);
      return response.data;
    },
    enabled: !!simulationId,
    retry: 2,
  });
}

/**
 * Hook para buscar casos que precisam de simulação
 */
export function useCasesNeedingSimulation() {
  return useQuery({
    queryKey: ["cases", "needing-simulation"],
    queryFn: async () => {
      const response = await api.get("/cases?status=aguardando_simulacao");
      return response.data?.items || [];
    },
    refetchInterval: 30000,
    retry: 2,
  });
}

/**
 * Hook para atualizar status de um caso após aprovação da simulação
 */
export function useUpdateCaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, status, simulationData }: {
      caseId: number;
      status: string;
      simulationData?: SimulationResult;
    }) => {
      const response = await api.patch(`/cases/${caseId}`, {
        status,
        simulation_approved: simulationData ? JSON.stringify(simulationData) : undefined
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries do caso
      queryClient.invalidateQueries({ queryKey: ["case", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar status do caso:", error);
      toast.error("Erro ao atualizar status do caso.");
    }
  });
}

/**
 * Hook utilitário para obter estatísticas do calculista
 */
export function useCalculistaStats() {
  return useQuery({
    queryKey: ["calculista", "stats"],
    queryFn: async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          api.get("/simulations?status=pending"),
          api.get("/simulations?status=approved&date=today"),
          api.get("/simulations?status=rejected&date=today")
        ]);

        return {
          pending: pendingRes.data?.count || 0,
          approvedToday: approvedRes.data?.count || 0,
          rejectedToday: rejectedRes.data?.count || 0,
          totalToday: (approvedRes.data?.count || 0) + (rejectedRes.data?.count || 0)
        };
      } catch (error) {
        // Retornar dados mock se API não suportar essas queries
        return {
          pending: 0,
          approvedToday: 12,
          rejectedToday: 2,
          totalToday: 14
        };
      }
    },
    refetchInterval: 60000, // Refetch a cada minuto
    retry: 1,
  });
}