import type { SimulationInput, SimulationTotals } from "@/lib/types/simulation";

/**
 * Função de arredondamento half-up para 2 casas decimais
 * Espelha o comportamento do backend com Decimal.quantize(ROUND_HALF_UP)
 */
function roundHalfUp(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Verifica se um banco é do tipo "Margem" (case-insensitive)
 */
function isMarginBank(bankName: string): boolean {
  return /margem/i.test(bankName || "");
}

/**
 * Calcula os totais da simulação conforme especificações da planilha.
 * Esta função espelha exatamente o cálculo do backend para feedback imediato.
 *
 * NOVA LÓGICA:
 * - Bancos "Margem*" não entram nos totais de financiado/saldo/liberado
 * - Bancos "Margem*" geram um "Valor a Subtrair" = |parcela| / coeficiente
 * - Para bancos reais: financiado = parcela / coeficiente
 * - Para bancos reais: liberado = |financiado - saldoDevedor| (não exibe negativo no frontend)
 */
export function computeTotals(input: SimulationInput): SimulationTotals {
  // Normalizar coeficiente (aceitar vírgula ou ponto)
  const coeficienteStr = String(input.coeficiente || "0").replace(",", ".");
  const coeficiente = parseFloat(coeficienteStr);

  if (!(coeficiente > 0)) {
    throw new Error("Coeficiente inválido ou zero");
  }

  // Separar bancos reais de bancos margem
  const bancosReais = input.banks.filter(b => !isMarginBank(b.bank));
  const bancosMargem = input.banks.filter(b => isMarginBank(b.bank));

  // Calcular totais APENAS dos bancos reais
  let totalFinanciado = 0;
  let saldoTotal = 0;
  let liberadoTotal = 0;

  for (const bank of bancosReais) {
    const parcela = bank.parcela || 0;
    const saldoDevedor = bank.saldoDevedor || 0;

    const financiado = parcela / coeficiente;
    const liberado = Math.abs(financiado - saldoDevedor);

    totalFinanciado += financiado;
    saldoTotal += saldoDevedor;
    liberadoTotal += liberado;
  }

  // Calcular Valor a Subtrair (soma das margens)
  let valorASubtrair = 0;
  for (const bank of bancosMargem) {
    const parcela = Math.abs(bank.parcela || 0);
    valorASubtrair += parcela / coeficiente;
  }

  // Total de parcelas (inclui TODOS os bancos, inclusive margem)
  const valorParcelaTotal = input.banks.reduce((sum, b) => sum + (b.parcela || 0), 0);

  // Cálculos finais
  const valorLiquido = liberadoTotal - (input.seguro || 0);
  const custoConsultoria = totalFinanciado * ((input.percentualConsultoria || 0) / 100);
  const liberadoCliente = valorLiquido - custoConsultoria - valorASubtrair;

  // Arredondar todos os valores para 2 casas decimais
  return {
    valorParcelaTotal: roundHalfUp(valorParcelaTotal),
    saldoTotal: roundHalfUp(saldoTotal),
    liberadoTotal: roundHalfUp(liberadoTotal),
    totalFinanciado: roundHalfUp(totalFinanciado),
    valorLiquido: roundHalfUp(valorLiquido),
    custoConsultoria: roundHalfUp(custoConsultoria),
    custoConsultoriaLiquido: roundHalfUp(custoConsultoria * 0.86),
    valorASubtrair: roundHalfUp(valorASubtrair),
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
 *
 * CENÁRIO 1 (Margem* negativa):
 * - Coef: 0,0193333, Seguro: 1000, % Consultoria: 11%
 * - Margem*: Parcela = -91,98
 * - SANTANDER: Parcela = 100,00, Saldo = 1000,00
 * - Resultado esperado: Liberado Cliente = -2.154,14
 *
 * CENÁRIO 2 (Governo Piauí - planilha do usuário):
 * - Coef: 0,0193333, Seguro: 1000, % Consultoria: 10%
 * - Margem*: Parcela = -91,98
 * - SANTANDER: Parcela = 500,00, Saldo = 1000,00
 * - Resultado esperado: Liberado Cliente = 16.518,31
 */
export function validateReferenceScenario(input: SimulationInput, result: SimulationTotals): boolean {
  const coef = parseFloat(String(input.coeficiente).replace(",", "."));

  // Cenário 1: Margem negativa simples
  const isScenario1 = (
    input.prazo === 96 &&
    Math.abs(coef - 0.0193333) < 0.0000001 &&
    input.percentualConsultoria === 11 &&
    input.seguro === 1000 &&
    input.banks.length === 2 &&
    input.banks.some(b => b.bank === "Margem*" && Math.abs(b.parcela + 91.98) < 0.01) &&
    input.banks.some(b => b.bank === "SANTANDER" && Math.abs(b.parcela - 100) < 0.01 && Math.abs(b.saldoDevedor - 1000) < 0.01)
  );

  if (isScenario1) {
    const expectedResult = -2154.14;
    return Math.abs(result.liberadoCliente - expectedResult) < 0.01;
  }

  // Cenário 2: Governo Piauí (planilha atual do usuário)
  const isScenario2 = (
    input.prazo === 96 &&
    Math.abs(coef - 0.0193333) < 0.0000001 &&
    input.percentualConsultoria === 10 &&
    input.seguro === 1000 &&
    input.banks.length === 2 &&
    input.banks.some(b => b.bank === "Margem*" && Math.abs(b.parcela + 91.98) < 0.01) &&
    input.banks.some(b => b.bank === "SANTANDER" && Math.abs(b.parcela - 500) < 0.01 && Math.abs(b.saldoDevedor - 1000) < 0.01)
  );

  if (isScenario2) {
    const expectedResult = 16518.31;
    return Math.abs(result.liberadoCliente - expectedResult) < 0.05; // Tolerância de R$ 0,05
  }

  return true; // Não é nenhum cenário de referência
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
