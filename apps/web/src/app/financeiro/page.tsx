"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useFinanceQueue, useFinanceDisburseSimple, useFinanceMetrics, useUploadContractAttachment, useCancelContract, useDeleteContract } from "@/lib/hooks";
import { FinanceCard, FinanceMetrics, ExpenseModal, Button } from "@lifecalling/ui";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign } from "lucide-react";

export default function Page(){
  useLiveCaseEvents();
  const queryClient = useQueryClient();
  const { data: items = [] } = useFinanceQueue();
  const { data: metrics } = useFinanceMetrics();
  const disb = useFinanceDisburseSimple();
  const cancelContract = useCancelContract();
  const deleteContract = useDeleteContract();
  const uploadAttachment = useUploadContractAttachment();
  const [uploadingContractId, setUploadingContractId] = useState<number | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Query para despesas
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: currentExpense } = useQuery({
    queryKey: ["expense", currentMonth, currentYear],
    queryFn: async () => {
      const response = await api.get(`/finance/expenses/${currentMonth}/${currentYear}`);
      return response.data?.expense;
    }
  });

  // Mutation para salvar despesa
  const saveExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/finance/expenses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["financeMetrics"] });
      toast.success("Despesa salva com sucesso!");
      setShowExpenseModal(false);
    },
    onError: (error: any) => {
      console.error('Erro ao salvar despesa:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar despesa");
    }
  });

  const handleDisburse = async (id: number) => {
    try {
      await disb.mutateAsync(id);
      toast.success("Liberação efetivada com sucesso!");
    } catch (error) {
      console.error('Erro ao efetivar:', error);
      toast.error("Erro ao efetivar liberação. Tente novamente.");
    }
  };

  const handleCancel = async (contractId: number) => {
    try {
      await cancelContract.mutateAsync(contractId);
      toast.success("Operação cancelada com sucesso!");
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error("Erro ao cancelar operação. Tente novamente.");
    }
  };

  const handleDelete = async (contractId: number) => {
    try {
      await deleteContract.mutateAsync(contractId);
      toast.success("Operação deletada com sucesso!");
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error("Erro ao deletar operação. Tente novamente.");
    }
  };

  // Função que será passada para cada FinanceCard
  const createUploadHandler = (contractId: number) => async (file: File) => {
    setUploadingContractId(contractId);
    try {
      await uploadAttachment.mutateAsync({ contractId, file });
      toast.success("Comprovante anexado com sucesso!");
    } catch (error) {
      console.error('Erro ao anexar comprovante:', error);
      toast.error("Erro ao anexar comprovante. Tente novamente.");
    } finally {
      setUploadingContractId(null);
    }
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {currentExpense ? "Editar" : "Adicionar"} Despesas
          </Button>
        </div>
      </div>

      {/* Info sobre despesa atual */}
      {currentExpense && (
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Despesas de {monthNames[currentMonth - 1]}/{currentYear}</h3>
              <p className="text-sm text-muted-foreground mt-1">{currentExpense.description || "Sem descrição"}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-danger">
                R$ {currentExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total de Despesas</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Financeiras */}
      {metrics && <FinanceMetrics {...metrics} />}

      {/* Lista de Casos Financeiros */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Atendimentos para Liberação</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {items.map((item: any) => {
            const contractId = item.contract?.id;
            const clientBankInfo = item.client ? {
              banco: item.client.banco,
              agencia: item.client.agencia,
              conta: item.client.conta,
              chave_pix: item.client.chave_pix,
              tipo_chave_pix: item.client.tipo_chave_pix
            } : undefined;

            return (
              <FinanceCard
                key={item.id}
                id={item.id}
                clientName={item.client?.name || `Cliente ${item.id}`}
                totalAmount={item.contract?.total_amount || 50000}
                installments={item.contract?.installments || 12}
                status={item.contract ? "disbursed" : "approved"}
                dueDate={new Date(Date.now() + 30*24*60*60*1000).toISOString()}
                onDisburse={handleDisburse}
                onCancel={contractId ? () => handleCancel(contractId) : undefined}
                onDelete={contractId ? () => handleDelete(contractId) : undefined}
                clientBankInfo={clientBankInfo}
                attachments={item.contract?.attachments || []}
                onUploadAttachment={contractId ? createUploadHandler(contractId) : undefined}
                isUploadingAttachment={uploadingContractId === contractId}
                caseDetails={{
                  cpf: item.client?.cpf,
                  matricula: item.client?.matricula,
                  created_at: item.created_at
                }}
              />
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-lg">✨ Nenhum atendimento pendente de liberação</p>
              <p className="text-sm">Todos os atendimentos financeiros foram processados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Despesas */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={(data) => saveExpenseMutation.mutate(data)}
        initialData={currentExpense}
        loading={saveExpenseMutation.isPending}
      />
    </div>
  );
}
