// Teste do simulador - Cenário Governo Piauí
// Execute: node test-simulador.js

function roundHalfUp(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeTotals(input) {
  const coeficienteStr = String(input.coeficiente).replace(",", ".");
  const coeficiente = parseFloat(coeficienteStr);

  console.log("=== ENTRADA ===");
  console.log("Coeficiente:", input.coeficiente, "→", coeficiente);
  console.log("Prazo:", input.prazo);
  console.log("Seguro:", input.seguro);
  console.log("% Consultoria:", input.percentualConsultoria);
  console.log("");

  // Separar bancos
  const bancosReais = input.banks.filter(b => !/margem/i.test(b.bank));
  const bancosMargem = input.banks.filter(b => /margem/i.test(b.bank));

  // Calcular totais dos bancos reais
  let totalFinanciado = 0;
  let saldoTotal = 0;
  let liberadoTotal = 0;

  console.log("=== BANCOS REAIS ===");
  for (const bank of bancosReais) {
    const parcela = bank.parcela || 0;
    const saldoDevedor = bank.saldoDevedor || 0;

    const financiado = parcela / coeficiente;
    const liberado = financiado - saldoDevedor;

    console.log(`${bank.bank}:`);
    console.log(`  Parcela: R$ ${parcela.toFixed(2)}`);
    console.log(`  Saldo Devedor: R$ ${saldoDevedor.toFixed(2)}`);
    console.log(`  Financiado = ${parcela} / ${coeficiente} = R$ ${financiado.toFixed(2)}`);
    console.log(`  Liberado = ${financiado.toFixed(2)} - ${saldoDevedor.toFixed(2)} = R$ ${liberado.toFixed(2)}`);

    totalFinanciado += financiado;
    saldoTotal += saldoDevedor;
    liberadoTotal += liberado;
  }

  // Calcular Valor a Subtrair (margem)
  let valorASubtrair = 0;
  console.log("");
  console.log("=== MARGEM ===");
  for (const bank of bancosMargem) {
    const parcela = Math.abs(bank.parcela || 0);
    valorASubtrair += parcela / coeficiente;
    console.log(`${bank.bank}: |${bank.parcela}| / ${coeficiente} = R$ ${(parcela / coeficiente).toFixed(2)}`);
  }

  // Cálculos finais
  const valorParcelaTotal = input.banks.reduce((sum, b) => sum + (b.parcela || 0), 0);
  const valorLiquido = liberadoTotal - (input.seguro || 0);
  const custoConsultoria = totalFinanciado * ((input.percentualConsultoria || 0) / 100);
  const liberadoCliente = valorLiquido - custoConsultoria - valorASubtrair;

  console.log("");
  console.log("=== TOTAIS ===");
  console.log(`Valor Parcela Total: R$ ${roundHalfUp(valorParcelaTotal).toFixed(2)}`);
  console.log(`Saldo Devedor Total: R$ ${roundHalfUp(saldoTotal).toFixed(2)}`);
  console.log(`Valor Liberado Total: R$ ${roundHalfUp(liberadoTotal).toFixed(2)}`);
  console.log(`Valor Total Financiado: R$ ${roundHalfUp(totalFinanciado).toFixed(2)}`);
  console.log(`Valor Líquido: R$ ${roundHalfUp(valorLiquido).toFixed(2)}`);
  console.log(`Custo Consultoria: R$ ${roundHalfUp(custoConsultoria).toFixed(2)}`);
  console.log(`Valor a Subtrair (Margem): R$ ${roundHalfUp(valorASubtrair).toFixed(2)}`);
  console.log("");
  console.log(`>>> LIBERADO PARA O CLIENTE: R$ ${roundHalfUp(liberadoCliente).toFixed(2)}`);

  return {
    valorParcelaTotal: roundHalfUp(valorParcelaTotal),
    saldoTotal: roundHalfUp(saldoTotal),
    liberadoTotal: roundHalfUp(liberadoTotal),
    totalFinanciado: roundHalfUp(totalFinanciado),
    valorLiquido: roundHalfUp(valorLiquido),
    custoConsultoria: roundHalfUp(custoConsultoria),
    valorASubtrair: roundHalfUp(valorASubtrair),
    liberadoCliente: roundHalfUp(liberadoCliente)
  };
}

// Cenário Governo Piauí
const input = {
  prazo: 96,
  coeficiente: "0,0193333",
  seguro: 1000,
  percentualConsultoria: 10,
  banks: [
    {
      bank: "Margem*",
      parcela: -91.98,
      saldoDevedor: 0,
      valorLiberado: 0
    },
    {
      bank: "SANTANDER",
      parcela: 500.00,
      saldoDevedor: 1000.00,
      valorLiberado: 0
    }
  ]
};

const result = computeTotals(input);

console.log("");
console.log("=== VALIDAÇÃO ===");
console.log("Esperado (planilha): R$ 16.518,31");
console.log("Obtido (sistema):    R$", result.liberadoCliente.toFixed(2).replace(".", ","));

const diff = Math.abs(result.liberadoCliente - 16518.31);
console.log("Diferença:           R$", diff.toFixed(2));

if (diff < 0.05) {
  console.log("");
  console.log("✅ TESTE PASSOU! Diferença aceitável (<R$ 0,05)");
} else {
  console.log("");
  console.log("❌ TESTE FALHOU! Diferença maior que R$ 0,05");
}
