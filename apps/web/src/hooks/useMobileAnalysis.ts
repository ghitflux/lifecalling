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
    staleTime: 5 * 60 * 1000, // 5 minutos - mesmo que adminSimulations
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Evitar refetch ao montar componente
    // REMOVIDO refetchInterval - causava recarregamento constante dos cards
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
    onSuccess: async (data, variables) => {
      console.log('✅ Pendência confirmada pelo backend:', data);
      console.log('📝 Dados enviados:', variables);

      toast.success('Simulação pendenciada com sucesso! Notificação enviada ao cliente.');

      // Invalidar todas as queries relacionadas
      console.log('🔄 Invalidando queries...');
      await queryClient.invalidateQueries({ queryKey: ['mobile-simulations'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulations'] });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulation'] });

      // Forçar refetch imediato das queries de análise
      console.log('🔄 Forçando refetch...');
      await queryClient.refetchQueries({ queryKey: ['mobile-simulations', 'analysis'] });

      console.log('✅ Queries atualizadas!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao pendenciar:', error);
      console.error('❌ Resposta do servidor:', error?.response?.data);
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
    onSuccess: async () => {
      toast.success('Simulação reprovada com sucesso! Card movido para tab Reprovadas.');
      // Invalidar todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['mobile-simulations'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulations'] });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulation'] });

      // Forçar refetch imediato das queries de análise
      await queryClient.refetchQueries({ queryKey: ['mobile-simulations', 'analysis'] });
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
    mutationFn: ({ id, data }: { id: string; data: ApproveForCalculationRequest }) => {
      console.log('📤 Aprovando simulação:', { id, data });
      return mobileApi.approveForCalculation(id, data);
    },
    onSuccess: async (responseData, variables) => {
      console.log('✅ Aprovação confirmada pelo backend:', responseData);
      console.log('📝 Dados enviados:', variables);

      toast.success('Simulação aprovada! Card movido para tab Aprovadas com status "Simulação Pendente".');

      // Invalidar todas as queries relacionadas
      console.log('🔄 Invalidando queries...');
      await queryClient.invalidateQueries({ queryKey: ['mobile-simulations'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulations'] });
      await queryClient.invalidateQueries({ queryKey: ['adminSimulation'] });

      // Forçar refetch imediato das queries de análise
      console.log('🔄 Forçando refetch...');
      await queryClient.refetchQueries({ queryKey: ['mobile-simulations', 'analysis'] });

      console.log('✅ Queries atualizadas!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao aprovar:', error);
      console.error('❌ Resposta completa:', error?.response);
      console.error('❌ Dados do erro:', error?.response?.data);
      const message = error?.response?.data?.detail || error?.message || 'Erro ao aprovar simulação';
      toast.error(message);
    },
  });
}

/**
 * Hook para baixar documento de uma simulação
 */
export function useDownloadSimulationDocument() {
  return useMutation({
    mutationFn: async ({ simulationId, documentType, filename }: {
      simulationId: string;
      documentType?: string;
      filename?: string;
    }) => {
      const blob = await mobileApi.getSimulationDocument(simulationId);
      return { blob, simulationId, documentType, filename };
    },
    onSuccess: ({ blob, simulationId, documentType, filename }) => {
      // Determinar extensão do arquivo baseado no tipo
      const extensionMap: Record<string, string> = {
        'jpeg': 'jpg',
        'jpg': 'jpg',
        'png': 'png',
        'pdf': 'pdf',
      };

      const extension = documentType
        ? extensionMap[documentType.toLowerCase()] || 'pdf'
        : 'pdf';

      // Usar filename original se disponível, senão gerar um genérico
      const downloadFilename = filename || `documento-${simulationId}.${extension}`;

      // Criar URL temporária do blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download iniciado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao baixar documento';
      toast.error(message);
    },
  });
}
