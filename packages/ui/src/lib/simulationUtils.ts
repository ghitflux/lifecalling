/* packages/ui/src/lib/simulationUtils.ts */

export interface SimulationInput {
  banco: string;
  saldoDevedor: number;
  parcelas: number;
  taxaJuros: number; // Taxa mensal em %
  seguroObrigatorio: number;
  percentualConsultoria: number; // Em %
  coeficiente?: number;
}

export interface SimulationResult {
  banco: string;
  valorLiberado: number;
  valorParcela: number;
  coeficiente: number;
  saldoDevedor: number;
  valorTotalFinanciado: number;
  seguroObrigatorio: number;
  valorLiquido: number;
  custoConsultoria: number;
  liberadoCliente: number;
  percentualConsultoria: number;
  taxaJuros: number;
  prazo: number;
}

/**
 * Calcula o coeficiente PRICE baseado na taxa de juros e número de parcelas
 */
export function calculatePriceCoefficient(taxaJuros: number, parcelas: number): number {
  const i = taxaJuros / 100; // Converter percentual para decimal
  if (i === 0) return 1 / parcelas; // Sem juros

  return i / (1 - Math.pow(1 + i, -parcelas));
}

/**
 * Calcula uma simulação completa de empréstimo
 */
export function calculateSimulation(input: SimulationInput): SimulationResult {
  const {
    banco,
    saldoDevedor,
    parcelas,
    taxaJuros,
    seguroObrigatorio,
    percentualConsultoria,
    coeficiente: customCoeficiente
  } = input;

  // Calcular coeficiente PRICE se não fornecido
  const coeficiente = customCoeficiente || calculatePriceCoefficient(taxaJuros, parcelas);

  // Valor da parcela = saldo devedor × coeficiente
  const valorParcela = saldoDevedor * coeficiente;

  // Valor total financiado = valor das parcelas × número de parcelas
  const valorTotalFinanciado = valorParcela * parcelas;

  // Valor liberado = saldo devedor + seguro obrigatório
  const valorLiberado = saldoDevedor + seguroObrigatorio;

  // Custo da consultoria = valor liberado × percentual consultoria
  const custoConsultoria = valorLiberado * (percentualConsultoria / 100);

  // Valor líquido = valor liberado - custo consultoria
  const valorLiquido = valorLiberado - custoConsultoria;

  // Liberado para o cliente = valor líquido
  const liberadoCliente = valorLiquido;

  return {
    banco,
    valorLiberado: Math.round(valorLiberado * 100) / 100,
    valorParcela: Math.round(valorParcela * 100) / 100,
    coeficiente: Math.round(coeficiente * 10000000) / 10000000, // 7 casas decimais
    saldoDevedor,
    valorTotalFinanciado: Math.round(valorTotalFinanciado * 100) / 100,
    seguroObrigatorio,
    valorLiquido: Math.round(valorLiquido * 100) / 100,
    custoConsultoria: Math.round(custoConsultoria * 100) / 100,
    liberadoCliente: Math.round(liberadoCliente * 100) / 100,
    percentualConsultoria: percentualConsultoria / 100, // Converter para decimal para o card
    taxaJuros,
    prazo: parcelas
  };
}

/**
 * Valida se os dados de entrada são válidos para simulação
 */
export function validateSimulationInput(input: Partial<SimulationInput>): string[] {
  const errors: string[] = [];

  if (!input.banco?.trim()) {
    errors.push('Banco é obrigatório');
  }

  if (!input.saldoDevedor || input.saldoDevedor <= 0) {
    errors.push('Saldo devedor deve ser maior que zero');
  }

  if (!input.parcelas || input.parcelas <= 0 || input.parcelas > 240) {
    errors.push('Número de parcelas deve estar entre 1 e 240');
  }

  if (!input.taxaJuros || input.taxaJuros < 0 || input.taxaJuros > 100) {
    errors.push('Taxa de juros deve estar entre 0% e 100%');
  }

  if (input.seguroObrigatorio === undefined || input.seguroObrigatorio < 0) {
    errors.push('Valor do seguro deve ser maior ou igual a zero');
  }

  if (!input.percentualConsultoria || input.percentualConsultoria < 0 || input.percentualConsultoria > 100) {
    errors.push('Percentual de consultoria deve estar entre 0% e 100%');
  }

  return errors;
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