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
import { StatusBadge } from '@lifecalling/ui';
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
      queryClient.invalidateQueries({ queryKey: ['calculista'] });
      queryClient.invalidateQueries({ queryKey: ['closing'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });

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
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card border-border">
        <Shield className="h-5 w-5 text-orange-400" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Controle Administrativo</h4>
          <p className="text-xs text-muted-foreground">Alterar status manualmente (apenas admin)</p>
        </div>
        
        {/* Status Atual */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Status Atual:</span>
          <StatusBadge status={currentStatus} size="sm" />
        </div>
        
        {/* Dropdown de Seleção */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Alterar para:</span>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px] h-9 bg-background border-border text-foreground hover:bg-accent focus:ring-ring focus:border-ring">
              <SelectValue placeholder="Selecionar status" className="text-foreground" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background border-border">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem 
                  key={value} 
                  value={value} 
                  className="py-2 text-foreground hover:bg-accent focus:bg-accent"
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="text-foreground">{label}</span>
                    {value === currentStatus && (
                      <Badge className="bg-orange-600 text-white text-xs px-2 py-1">Atual</Badge>
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Confirmar Alteração de Status
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Você está prestes a alterar o status deste caso manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">Status Atual:</span>
              <Badge variant="outline" className="text-foreground border-border">{STATUS_LABELS[currentStatus]}</Badge>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">↓</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">Novo Status:</span>
              <Badge className="bg-orange-600 text-white border-orange-600">{STATUS_LABELS[selectedStatus]}</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelChange} className="border-border text-foreground hover:bg-accent">
              Cancelar
            </Button>
            <Button
              onClick={confirmChange}
              disabled={changeStatusMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500 font-medium"
            >
              {changeStatusMutation.isPending ? 'Alterando...' : 'Confirmar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
