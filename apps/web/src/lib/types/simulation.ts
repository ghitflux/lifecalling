export interface SimulationBankInput {
  bank: string;
  parcela: number;        // R$
  saldoDevedor: number;   // R$
  valorLiberado: number;  // R$
}

export interface SimulationInput {
  banks: SimulationBankInput[]; // 1 a 4 bancos
  prazo: number;                // meses
  coeficiente: string;          // texto livre
  seguro: number;               // R$
  percentualConsultoria: number; // 0-100%
}

export interface SimulationTotals {
  valorParcelaTotal: number;
  saldoTotal: number;
  liberadoTotal: number;
  totalFinanciado: number;
  valorLiquido: number;
  custoConsultoria: number;
  custoConsultoriaLiquido: number;
  liberadoCliente: number;
}

export interface SimulationResponse {
  id: number;
  status: string;
  totals: SimulationTotals;
}

export interface SimulationDB {
  id: number;
  case_id: number;
  status: "draft" | "approved" | "rejected";
  banks_json: SimulationBankInput[];
  prazo: number;
  coeficiente: string;
  seguro: number;
  percentual_consultoria: number;

  valor_parcela_total: number;
  saldo_total: number;
  liberado_total: number;
  total_financiado: number;
  valor_liquido: number;
  custo_consultoria: number;
  liberado_cliente: number;

  created_by: number;
  created_at: string;
  updated_at: string;
}

// Lista de bancos disponíveis
export const AVAILABLE_BANKS = [
  "SANTANDER",
  "BRADESCO",
  "ITAU",
  "BANCO_DO_BRASIL",
  "CAIXA",
  "SICOOB",
  "SICREDI",
  "PAN",
  "ORIGINAL"
] as const;

export type BankName = typeof AVAILABLE_BANKS[number];