"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { toast } from "sonner";

// Novo interface seguindo modelo de importação TXT
interface ManualPayrollData {
  // Dados do funcionário
  matricula: string;  // Formato: 001347-1
  nome: string;
  cargo: string;
  cpf: string;
  
  // Dados do financiamento
  fin_code: string;
  orgao: string;
  total_parcelas: number;
  parcelas_pagas: number;
  valor_parcela: number;
  orgao_pgto: string;
  
  // Dados da entidade
  entidade_codigo: string;
  entidade_nome: string;
  ref_month: number;
  ref_year: number;
  data_geracao: string;
  
  // Anexo
  attachment_base64?: string;
  attachment_filename?: string;
}

interface ManualPayrollResponse {
  client_id: number;
  case_id: number;
  payroll_line_id: number;
  success: boolean;
  message: string;
}

export function useCreateManualPayrollClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ManualPayrollData) => {
      const response = await api.post<ManualPayrollResponse>(
        "/clients/manual-payroll",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/clients/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/clients/filters"] });
      
      // Mostrar mensagem de sucesso
      toast.success(data.message, {
        description: `Cliente ID: ${data.client_id} | Caso ID: ${data.case_id} | PayrollLine ID: ${data.payroll_line_id}`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Erro ao criar cliente";
      toast.error(message, {
        description: "Verifique os dados e tente novamente.",
        duration: 5000,
      });
    },
  });
}

