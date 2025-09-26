// apps/web/src/lib/calc.ts
export type SimuladorInput = {
  banco: string;
  parcelas: number;                  // n
  saldoDevedor: number;              // C7
  parcela: number;                   // B7
  seguroObrigatorio: number;         // E23
  percentualOperacaoMes: number;     // i em % ao mês (ex.: 2.5 => 0.025)
  percentualConsultoria: number;     // E31 (ex.: 0.12 => 12%)
  coeficienteManual?: number | null; // se fornecido, ignora PRICE
};

export type SimuladorOutput = {
  coeficiente: number;             // D4
  valorLiberado: number;           // E7
  valorParcelaTotal: number;       // E17 (para 1 linha = parcela)
  saldoDevedorTotal: number;       // E18 (= saldoDevedor)
  valorLiberadoTotal: number;      // E20 (= valorLiberado aqui)
  valorTotalFinanciado: number;    // E22
  valorLiquido: number;            // E25
  custoConsultoria: number;        // E27 (=E49)
  liberadoCliente: number;         // E29
  trintaPorCentoDoLiquido: number; // E51
};

// PRICE: coef = i / (1 - (1+i)^-n)
export function priceCoef(i: number, n: number) {
  if (i <= 0 || n <= 0) return 0;
  return i / (1 - Math.pow(1 + i, -n));
}

export function simuladorSantander(input: SimuladorInput): SimuladorOutput {
  const i = input.percentualOperacaoMes / 100; // % → fração
  const coef = input.coeficienteManual && input.coeficienteManual > 0
    ? input.coeficienteManual
    : priceCoef(i, input.parcelas);

  // Cálculo idêntico à planilha (1 linha):
  const valorLiberado = coef > 0 ? input.parcela / coef - input.saldoDevedor : 0; // E7
  const valorParcelaTotal = input.parcela;                                        // E17 (1 linha)
  const saldoDevedorTotal = input.saldoDevedor;                                   // E18
  const valorLiberadoTotal = valorLiberado;                                       // E20
  const valorTotalFinanciado = saldoDevedorTotal + valorLiberadoTotal;            // E22
  const valorLiquido = valorLiberadoTotal - input.seguroObrigatorio;              // E25
  const custoConsultoria = valorTotalFinanciado * input.percentualConsultoria;    // E27 = E22 * E31
  const liberadoCliente = valorLiquido - custoConsultoria;                        // E29
  const trintaPorCentoDoLiquido = valorLiquido * 0.30;                            // E51

  // Arredondar a 2 casas para moedas (exibição)
  const fix2 = (x:number)=> Math.round((x + Number.EPSILON) * 100) / 100;

  return {
    coeficiente: coef,
    valorLiberado: fix2(valorLiberado),
    valorParcelaTotal: fix2(valorParcelaTotal),
    saldoDevedorTotal: fix2(saldoDevedorTotal),
    valorLiberadoTotal: fix2(valorLiberadoTotal),
    valorTotalFinanciado: fix2(valorTotalFinanciado),
    valorLiquido: fix2(valorLiquido),
    custoConsultoria: fix2(custoConsultoria),
    liberadoCliente: fix2(liberadoCliente),
    trintaPorCentoDoLiquido: fix2(trintaPorCentoDoLiquido),
  };
}
