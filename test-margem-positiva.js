/**
 * Teste: Margem Positiva deve funcionar como banco REAL
 * 
 * Cenário:
 * - Banco 1 (SANTANDER): Parcela R$ 500, Saldo R$ 1.000
 * - Banco 2 (Margem Positiva): Parcela R$ 200, Saldo R$ 0
 * - Coeficiente: 0,02 (para facilitar cálculo)
 * - Seguro: R$ 0
 * - % Consultoria: 10%
 * 
 * Resultado Esperado:
 * - SANTANDER: financiado = 500/0,02 = 25.000, liberado = 25.000 - 1.000 = 24.000
 * - Margem Positiva: financiado = 200/0,02 = 10.000, liberado = 10.000 - 0 = 10.000
 * - Total Financiado = 25.000 + 10.000 = 35.000
 * - Liberado Total = 24.000 + 10.000 = 34.000
 * - Custo Consultoria = 35.000 × 10% = 3.500
 * - Liberado Cliente = 34.000 - 3.500 = 30.500
 * 
 * Margem Positiva NÃO deve subtrair do valor final!
 */

async function testMargemPositiva() {
  const input = {
    banks: [
      { bank: "SANTANDER", parcela: 500, saldoDevedor: 1000, valorLiberado: 24000 },
      { bank: "Margem Positiva", parcela: 200, saldoDevedor: 0, valorLiberado: 10000 }
    ],
    prazo: 96,
    coeficiente: "0,02",
    seguro: 0,
    percentualConsultoria: 10
  };

  console.log("\n=== TESTE: Margem Positiva como Banco Real ===\n");
  console.log("INPUT:", JSON.stringify(input, null, 2));

  try {
    const response = await fetch("http://localhost:8000/api/simulations/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    const result = await response.json();
    console.log("\n--- RESULTADO ---");
    console.log(JSON.stringify(result, null, 2));

    if (result.totals) {
      const { totals } = result;
      console.log("\n--- VALIDAÇÃO ---");
      
      const checks = [
        { 
          name: "Total Financiado", 
          expected: 35000, 
          actual: totals.totalFinanciado,
          reason: "SANTANDER (25.000) + Margem Positiva (10.000)"
        },
        { 
          name: "Liberado Total", 
          expected: 34000, 
          actual: totals.liberadoTotal,
          reason: "SANTANDER (24.000) + Margem Positiva (10.000)"
        },
        { 
          name: "Custo Consultoria", 
          expected: 3500, 
          actual: totals.custoConsultoria,
          reason: "35.000 × 10%"
        },
        { 
          name: "Valor a Subtrair", 
          expected: 0, 
          actual: totals.valorASubtrair,
          reason: "Margem Positiva NÃO deve subtrair"
        },
        { 
          name: "Liberado Cliente", 
          expected: 30500, 
          actual: totals.liberadoCliente,
          reason: "34.000 - 3.500"
        }
      ];

      let allPassed = true;
      checks.forEach(check => {
        const passed = Math.abs(check.expected - check.actual) < 0.01;
        const status = passed ? "✓ PASSOU" : "✗ FALHOU";
        console.log(`${status} | ${check.name}: esperado ${check.expected}, atual ${check.actual}`);
        console.log(`  Razão: ${check.reason}`);
        if (!passed) allPassed = false;
      });

      console.log("\n" + (allPassed ? "✓ TODOS OS TESTES PASSARAM!" : "✗ ALGUNS TESTES FALHARAM!"));
    }
  } catch (error) {
    console.error("ERRO:", error.message);
  }
}

testMargemPositiva();
