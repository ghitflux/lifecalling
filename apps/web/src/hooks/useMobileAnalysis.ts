import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileApi, PendSimulationRequest, ReproveSimulationRequest, ApproveForCalculationRequest } from '@/services/mobileApi';
import { toast } from 'sonner';

/**
 * Hook para buscar simulações pendentes de análise
 */
export function useSimulationsForAnalysis() {
  return useQuery({
    queryKey: ['mobile-simulations', 'analysis'],
    queryFn: mobileApi.getSimulationsForAnalysis,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para pendenciar uma simulação (solicitar documentos)
 */
export function usePendSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PendSimulationRequest }) =>
      mobileApi.pendSimulation(id, data),
    onSuccess: () => {
      toast.success('Simulação pendenciada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['mobile-simulations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao pendenciar simulação';
      toast.error(message);
    },
  });
}

/**
 * Hook para reprovar uma simulação
 */
export function useReproveSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReproveSimulationRequest }) =>
      mobileApi.reproveSimulation(id, data),
    onSuccess: () => {
      toast.success('Simulação reprovada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['mobile-simulations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao reprovar simulação';
      toast.error(message);
    },
  });
}

/**
 * Hook para aprovar uma simulação e enviar para o calculista
 */
export function useApproveForCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveForCalculationRequest }) =>
      mobileApi.approveForCalculation(id, data),
    onSuccess: () => {
      toast.success('Simulação aprovada e enviada para o calculista!');
      queryClient.invalidateQueries({ queryKey: ['mobile-simulations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao aprovar simulação';
      toast.error(message);
    },
  });
}

/**
 * Hook para baixar documento de uma simulação
 */
export function useDownloadSimulationDocument() {
  return useMutation({
    mutationFn: async (simulationId: string) => {
      const blob = await mobileApi.getSimulationDocument(simulationId);
      return { blob, simulationId };
    },
    onSuccess: ({ blob, simulationId }) => {
      // Criar URL temporária do blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documento-${simulationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao baixar documento';
      toast.error(message);
    },
  });
}
