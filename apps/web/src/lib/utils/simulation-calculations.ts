import type { SimulationInput, SimulationTotals } from "@/lib/types/simulation";

/**
 * Função de arredondamento half-up para 2 casas decimais
 * Espelha o comportamento do backend com Decimal.quantize(ROUND_HALF_UP)
 */
function roundHalfUp(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula os totais da simulação conforme especificações da planilha.
 * Esta função espelha exatamente o cálculo do backend para feedback imediato.
 */
export function computeTotals(input: SimulationInput): SimulationTotals {
  // Somas dos bancos
  let valorParcelaTotal = 0;
  let saldoTotal = 0;
  let liberadoTotal = 0;

  for (const bank of input.banks) {
    valorParcelaTotal += bank.parcela || 0;
    saldoTotal += bank.saldoDevedor || 0;
    liberadoTotal += bank.valorLiberado || 0;
  }

  // Cálculos principais seguindo as fórmulas especificadas
  const totalFinanciado = saldoTotal + liberadoTotal;
  const valorLiquido = liberadoTotal - (input.seguro || 0);
  const custoConsultoria = totalFinanciado * ((input.percentualConsultoria || 0) / 100);
  const liberadoCliente = valorLiquido - custoConsultoria;

  // Arredondar todos os valores para 2 casas decimais
  return {
    valorParcelaTotal: roundHalfUp(valorParcelaTotal),
    saldoTotal: roundHalfUp(saldoTotal),
    liberadoTotal: roundHalfUp(liberadoTotal),
    totalFinanciado: roundHalfUp(totalFinanciado),
    valorLiquido: roundHalfUp(valorLiquido),
    custoConsultoria: roundHalfUp(custoConsultoria),
    custoConsultoriaLiquido: roundHalfUp(custoConsultoria * 0.86),
    liberadoCliente: roundHalfUp(liberadoCliente)
  };
}

/**
 * Valida se os dados de entrada são válidos para simulação
 */
export function validateSimulationInput(input: Partial<SimulationInput>): string[] {
  const errors: string[] = [];

  if (!input.banks || input.banks.length === 0) {
    errors.push("Pelo menos um banco deve ser informado");
  }

  if (input.banks && input.banks.length > 4) {
    errors.push("Máximo de 4 bancos permitidos");
  }

  if (input.banks) {
    input.banks.forEach((bank, i) => {
      if (!bank.bank?.trim()) {
        errors.push(`Nome do banco ${i + 1} é obrigatório`);
      }

      // Para banco Margem*, permitir parcela negativa
      if (bank.bank === "Margem*") {
        if (bank.parcela === undefined || bank.parcela === null || bank.parcela === 0) {
          errors.push(`Parcela do banco ${i + 1} deve ser informada`);
        }
      } else {
        if (!bank.parcela || bank.parcela <= 0) {
          errors.push(`Parcela do banco ${i + 1} deve ser maior que zero`);
        }
      }

      // Para banco Margem*, saldo devedor pode ser zero ou negativo
      if (bank.bank !== "Margem*") {
        if (!bank.saldoDevedor || bank.saldoDevedor <= 0) {
          errors.push(`Saldo devedor do banco ${i + 1} deve ser maior que zero`);
        }
      }

      // Para banco Margem*, permitir valor liberado negativo
      if (bank.bank === "Margem*") {
        if (bank.valorLiberado === undefined || bank.valorLiberado === null || bank.valorLiberado === 0) {
          errors.push(`Valor liberado do banco ${i + 1} deve ser informado`);
        }
      } else {
        if (!bank.valorLiberado || bank.valorLiberado <= 0) {
          errors.push(`Valor liberado do banco ${i + 1} deve ser maior que zero`);
        }
      }
    });
  }

  if (!input.prazo || input.prazo <= 0 || input.prazo > 240) {
    errors.push("Prazo deve estar entre 1 e 240 meses");
  }

  if (input.seguro === undefined || input.seguro < 0) {
    errors.push("Seguro obrigatório deve ser maior ou igual a zero");
  }

  if (!input.percentualConsultoria || input.percentualConsultoria < 0 || input.percentualConsultoria > 100) {
    errors.push("Percentual de consultoria deve estar entre 0% e 100%");
  }

  return errors;
}

/**
 * Testa se o resultado coincide com o cenário de referência da planilha
 */
export function validateReferenceScenario(input: SimulationInput, result: SimulationTotals): boolean {
  // Cenário de teste: Prazo: 96, Coef.: 0,0192223, Parcela: 1.000,00;
  // Saldo Devedor: 30.000,00; Valor Liberado: 22.022,91; Seguro: 1.000,00; % Consultoria: 12%
  // Resultado esperado: Liberado Cliente = 14.780,16

  const isReferenceScenario = (
    input.prazo === 96 &&
    input.percentualConsultoria === 12 &&
    input.seguro === 1000 &&
    input.banks.length === 1 &&
    input.banks[0].parcela === 1000 &&
    input.banks[0].saldoDevedor === 30000 &&
    Math.abs(input.banks[0].valorLiberado - 22022.91) < 0.01
  );

  if (!isReferenceScenario) {
    return true; // Não é o cenário de referência, então não validamos
  }

  // Verificar se o resultado está correto (tolerância de 0.01)
  const expectedResult = 14780.16;
  return Math.abs(result.liberadoCliente - expectedResult) < 0.01;
}

/**
 * Formatar valor como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Converter string de moeda para número
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}