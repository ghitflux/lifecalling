"use client";

/**
 * Componente para admin alterar status de qualquer caso.
 * Exibe dropdown com todos os status possíveis.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AdminStatusChangerProps {
  caseId: number;
  currentStatus: string;
}

// Mapeamento de status para labels
const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  calculista_pendente: 'Calculista Pendente',
  aprovado: 'Aprovado',
  retorno_fechamento: 'Retorno Fechamento',
  fechamento_aprovado: 'Fechamento Aprovado',
  financeiro_pendente: 'Financeiro Pendente',
  contrato_efetivado: 'Contrato Efetivado',
  encerrado: 'Encerrado',
  devolvido_financeiro: 'Devolvido Financeiro',
  sem_contato: 'Sem Contato'
};

// Mapeamento de status para rotas corretas
const STATUS_ROUTES: Record<string, string> = {
  novo: '/esteira',
  em_atendimento: '/esteira',
  calculista_pendente: '/calculista',
  aprovado: '/calculista',
  retorno_fechamento: '/calculista',
  fechamento_aprovado: '/fechamento',
  financeiro_pendente: '/financeiro',
  contrato_efetivado: '/financeiro',
  encerrado: '/casos',
  devolvido_financeiro: '/calculista',
  sem_contato: '/casos'
};

export default function AdminStatusChanger({ caseId, currentStatus }: AdminStatusChangerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Mutation para alterar status
  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await api.patch(`/cases/${caseId}/status`, {
        new_status: newStatus
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['/cases'] });

      toast.success(data.message || 'Status alterado com sucesso!');
      setShowConfirmDialog(false);

      // Verificar se deve navegar para outra tela
      const newStatus = data.new_status;
      const correctRoute = STATUS_ROUTES[newStatus];
      const currentPath = window.location.pathname;

      // Se não estamos na rota correta para o novo status, perguntar se quer navegar
      if (correctRoute && !currentPath.includes(correctRoute)) {
        toast.info(
          `Caso movido para "${STATUS_LABELS[newStatus]}". Deseja navegar para a tela correta?`,
          {
            duration: 8000,
            action: {
              label: 'Ir para tela',
              onClick: () => router.push(correctRoute)
            }
          }
        );
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao alterar status';
      toast.error(errorMessage);
      setShowConfirmDialog(false);
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    if (newStatus !== currentStatus) {
      setShowConfirmDialog(true);
    }
  };

  const confirmChange = () => {
    changeStatusMutation.mutate(selectedStatus);
  };

  const cancelChange = () => {
    setSelectedStatus(currentStatus);
    setShowConfirmDialog(false);
  };

  // Apenas admin pode ver e usar este componente
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-orange-50 border-orange-200">
        <Shield className="h-5 w-5 text-orange-600" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-orange-900">Controle Administrativo</h4>
          <p className="text-xs text-orange-700">Alterar status manualmente (apenas admin)</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {value === currentStatus && (
                      <Badge variant="outline" className="text-xs">Atual</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirmar Alteração de Status
            </DialogTitle>
            <DialogDescription>
              Você está prestes a alterar o status deste caso manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Status Atual:</span>
              <Badge variant="outline">{STATUS_LABELS[currentStatus]}</Badge>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">↓</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-sm font-medium">Novo Status:</span>
              <Badge className="bg-orange-600 text-white">{STATUS_LABELS[selectedStatus]}</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelChange}>
              Cancelar
            </Button>
            <Button
              onClick={confirmChange}
              disabled={changeStatusMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {changeStatusMutation.isPending ? 'Alterando...' : 'Confirmar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
