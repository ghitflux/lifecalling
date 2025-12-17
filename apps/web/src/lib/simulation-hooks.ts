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
      queryClient.invalidateQueries({ queryKey: ["calculation", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["calculista", "stats"] });

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
      queryClient.invalidateQueries({ queryKey: ["calculation", "kpis"] });
      queryClient.invalidateQueries({ queryKey: ["calculista", "stats"] });
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
    queryKey: ["simulations", "draft"],
    queryFn: async () => {
      const response = await api.get("/simulations?status=draft");
      return response.data?.items || [];
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: 2,
    staleTime: 15000, // Considerar dados obsoletos após 15 segundos
  });
}

/**
 * Hook para buscar todas as simulações (incluindo concluídas de hoje)
 */
export function useAllSimulations(
  includeCompletedToday: boolean = false,
  params?: { search?: string; page?: number; pageSize?: number; caseStatus?: string; uniqueByCpf?: boolean }
) {
  return useQuery({
    queryKey: [
      "simulations",
      includeCompletedToday ? "all" : "draft",
      params?.search,
      params?.page,
      params?.pageSize,
      params?.caseStatus
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (includeCompletedToday) {
        searchParams.append("all", "true");  // Buscar TODAS as simulações
      } else {
        searchParams.append("status", "draft");
      }

      if (params?.search) searchParams.append("search", params.search);
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.pageSize) searchParams.append("page_size", params.pageSize.toString());
      if (params?.caseStatus) searchParams.append("case_status", params.caseStatus);
      if (params?.uniqueByCpf) searchParams.append("unique_by_cpf", "true");

      const response = await api.get(`/simulations?${searchParams.toString()}`);
      return {
        items: response.data?.items || [],
        totalCount: response.data?.total_count || 0,
        page: response.data?.page || 1,
        pageSize: response.data?.page_size || 20,
        totalPages: response.data?.total_pages || 1
      };
    },
    staleTime: 5000, // Considerar dados obsoletos após 5 segundos
    refetchInterval: false, // Desabilitar refetch automático para evitar interrupções
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 2,
    placeholderData: (previousData) => previousData, // Manter dados anteriores durante nova busca (melhor que keepPreviousData)
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
 * Hook utilitário para obter estatísticas avançadas do calculista
 */
export function useCalculistaStats() {
  return useQuery({
    queryKey: ["calculista", "stats"],
    queryFn: async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          api.get("/simulations?status=draft"),
          api.get("/simulations?status=approved&date=today"),
          api.get("/simulations?status=rejected&date=today")
        ]);

        const pending = pendingRes.data?.count || 0;
        const approvedToday = approvedRes.data?.count || 0;
        const rejectedToday = rejectedRes.data?.count || 0;
        const totalToday = approvedToday + rejectedToday;

        // Calcular taxa de aprovação
        const approvalRate = totalToday > 0
          ? Math.round((approvedToday / totalToday) * 100)
          : 0;

        // Calcular volume financeiro (soma de liberadoCliente das aprovadas)
        // IMPORTANTE: Agrupar por case_id para evitar somar duplicatas (múltiplas simulações do mesmo caso)
        const uniqueCases = new Map<number, any>();
        (approvedRes.data?.items || []).forEach((sim: any) => {
          const caseId = sim.case_id;
          // Manter apenas a simulação mais recente de cada caso (última atualização)
          if (!uniqueCases.has(caseId) ||
              new Date(sim.updated_at || sim.created_at) > new Date(uniqueCases.get(caseId).updated_at || uniqueCases.get(caseId).created_at)) {
            uniqueCases.set(caseId, sim);
          }
        });

        const volumeToday = Array.from(uniqueCases.values()).reduce((sum: number, sim: any) => {
          return sum + (sim.totals?.liberadoCliente || 0);
        }, 0);

        return {
          pending,
          approvedToday,
          rejectedToday,
          totalToday,
          approvalRate,
          volumeToday
        };
      } catch (error) {
        console.error("Erro ao buscar estatísticas do calculista:", error);
        // Retornar dados zerados em caso de erro
        return {
          pending: 0,
          approvedToday: 0,
          rejectedToday: 0,
          totalToday: 0,
          approvalRate: 0,
          volumeToday: 0
        };
      }
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: 1,
  });
}

/**
 * Hook para buscar TODAS as simulações de um caso específico
 * Inclui draft, superseded, approved e rejected
 */
export function useAllCaseSimulations(caseId: number | null) {
  return useQuery({
    queryKey: ["simulations", "case", caseId, "all"],
    queryFn: async () => {
      if (!caseId) return { items: [], count: 0, current_simulation_id: null };
      const response = await api.get(`/simulations/case/${caseId}/all`);
      return response.data;
    },
    enabled: !!caseId,
    retry: 2,
    staleTime: 5000,
  });
}

/**
 * Hook para definir uma simulação como final
 */
export function useSetFinalSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (simId: number) => {
      const response = await api.post(`/simulations/${simId}/set-as-final`);
      return response.data;
    },
    onSuccess: (data, simId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case"] });
      toast.success("Simulação definida como final com sucesso!");
      return data;
    },
    onError: (error: any) => {
      console.error("Erro ao definir simulação como final:", error);
      const errorMessage = error?.response?.data?.detail || "Erro ao definir simulação como final";
      toast.error(errorMessage);
    }
  });
}