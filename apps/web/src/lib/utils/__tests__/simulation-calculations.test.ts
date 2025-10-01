import { describe, it, expect } from 'vitest';
import { computeTotals, validateSimulationInput, validateReferenceScenario } from '../simulation-calculations';
import type { SimulationInput } from '@/lib/types/simulation';

describe('simulation-calculations', () => {
  describe('computeTotals', () => {
    it('should calculate correctly for single bank scenario', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'SANTANDER',
            parcela: 1000.00,
            saldoDevedor: 30000.00,
            valorLiberado: 22022.91
          }
        ],
        prazo: 96,
        coeficiente: '0,0192223',
        seguro: 1000.00,
        percentualConsultoria: 12.0
      };

      const result = computeTotals(input);

      expect(result.valorParcelaTotal).toBe(1000.00);
      expect(result.saldoTotal).toBe(30000.00);
      expect(result.liberadoTotal).toBe(22022.91);
      expect(result.totalFinanciado).toBe(52022.91);
      expect(result.valorLiquido).toBe(21022.91);
      expect(result.custoConsultoria).toBe(6242.75);
      expect(result.custoConsultoriaLiquido).toBe(5368.76); // 6242.75 * 0.86 = 5368.765 -> 5368.76 (rounded)
      expect(result.liberadoCliente).toBe(14780.16);
    });

    it('should calculate correctly for multi-bank scenario', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'SANTANDER',
            parcela: 800.00,
            saldoDevedor: 20000.00,
            valorLiberado: 15000.00
          },
          {
            bank: 'BRADESCO',
            parcela: 600.00,
            saldoDevedor: 15000.00,
            valorLiberado: 12000.00
          }
        ],
        prazo: 84,
        coeficiente: '0,015',
        seguro: 500.00,
        percentualConsultoria: 10.0
      };

      const result = computeTotals(input);

      expect(result.valorParcelaTotal).toBe(1400.00);
      expect(result.saldoTotal).toBe(35000.00);
      expect(result.liberadoTotal).toBe(27000.00);
      expect(result.totalFinanciado).toBe(62000.00);
      expect(result.valorLiquido).toBe(26500.00);
      expect(result.custoConsultoria).toBe(6200.00);
      expect(result.custoConsultoriaLiquido).toBe(5332.00); // 6200.00 * 0.86 = 5332.00
      expect(result.liberadoCliente).toBe(20300.00);
    });

    it('should handle zero values correctly', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'CAIXA',
            parcela: 500.00,
            saldoDevedor: 10000.00,
            valorLiberado: 8000.00
          }
        ],
        prazo: 60,
        coeficiente: '0,02',
        seguro: 0,
        percentualConsultoria: 0
      };

      const result = computeTotals(input);

      expect(result.valorParcelaTotal).toBe(500.00);
      expect(result.saldoTotal).toBe(10000.00);
      expect(result.liberadoTotal).toBe(8000.00);
      expect(result.totalFinanciado).toBe(18000.00);
      expect(result.valorLiquido).toBe(8000.00);
      expect(result.custoConsultoria).toBe(0);
      expect(result.custoConsultoriaLiquido).toBe(0); // 0 * 0.86 = 0
      expect(result.liberadoCliente).toBe(8000.00);
    });

    it('should handle decimal rounding correctly', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'ITAU',
            parcela: 333.33,
            saldoDevedor: 10000.00,
            valorLiberado: 8333.33
          }
        ],
        prazo: 60,
        coeficiente: '0,02',
        seguro: 100.00,
        percentualConsultoria: 7.5
      };

      const result = computeTotals(input);

      expect(result.valorParcelaTotal).toBe(333.33);
      expect(result.saldoTotal).toBe(10000.00);
      expect(result.liberadoTotal).toBe(8333.33);
      expect(result.totalFinanciado).toBe(18333.33);
      expect(result.valorLiquido).toBe(8233.33);
      expect(result.custoConsultoria).toBe(1375.00); // 18333.33 * 7.5% = 1375.00
      expect(result.liberadoCliente).toBe(6858.33); // 8233.33 - 1375.00 = 6858.33
    });

    it('should handle 4 banks scenario', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'SANTANDER',
            parcela: 250.00,
            saldoDevedor: 7500.00,
            valorLiberado: 5000.00
          },
          {
            bank: 'BRADESCO',
            parcela: 300.00,
            saldoDevedor: 9000.00,
            valorLiberado: 6000.00
          },
          {
            bank: 'ITAU',
            parcela: 200.00,
            saldoDevedor: 6000.00,
            valorLiberado: 4000.00
          },
          {
            bank: 'CAIXA',
            parcela: 150.00,
            saldoDevedor: 4500.00,
            valorLiberado: 3000.00
          }
        ],
        prazo: 72,
        coeficiente: '0,018',
        seguro: 800.00,
        percentualConsultoria: 15.0
      };

      const result = computeTotals(input);

      expect(result.valorParcelaTotal).toBe(900.00);
      expect(result.saldoTotal).toBe(27000.00);
      expect(result.liberadoTotal).toBe(18000.00);
      expect(result.totalFinanciado).toBe(45000.00);
      expect(result.valorLiquido).toBe(17200.00);
      expect(result.custoConsultoria).toBe(6750.00);
      expect(result.liberadoCliente).toBe(10450.00);
    });
  });

  describe('validateSimulationInput', () => {
    it('should return no errors for valid input', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'SANTANDER',
            parcela: 1000,
            saldoDevedor: 30000,
            valorLiberado: 22000
          }
        ],
        prazo: 96,
        coeficiente: '0,02',
        seguro: 1000,
        percentualConsultoria: 12
      };

      const errors = validateSimulationInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid input', () => {
      const input: Partial<SimulationInput> = {
        banks: [],
        prazo: 0,
        seguro: -100,
        percentualConsultoria: 150
      };

      const errors = validateSimulationInput(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Pelo menos um banco deve ser informado');
      expect(errors).toContain('Prazo deve estar entre 1 e 240 meses');
      expect(errors).toContain('Seguro obrigatório deve ser maior ou igual a zero');
      expect(errors).toContain('Percentual de consultoria deve estar entre 0% e 100%');
    });

    it('should validate bank data', () => {
      const input: Partial<SimulationInput> = {
        banks: [
          {
            bank: '',
            parcela: 0,
            saldoDevedor: -1000,
            valorLiberado: 0
          }
        ],
        prazo: 96,
        seguro: 1000,
        percentualConsultoria: 12
      };

      const errors = validateSimulationInput(input);
      expect(errors).toContain('Nome do banco 1 é obrigatório');
      expect(errors).toContain('Parcela do banco 1 deve ser maior que zero');
      expect(errors).toContain('Saldo devedor do banco 1 deve ser maior que zero');
      expect(errors).toContain('Valor liberado do banco 1 deve ser maior que zero');
    });

    it('should reject more than 4 banks', () => {
      const input: Partial<SimulationInput> = {
        banks: [
          { bank: 'BANK1', parcela: 100, saldoDevedor: 1000, valorLiberado: 800 },
          { bank: 'BANK2', parcela: 100, saldoDevedor: 1000, valorLiberado: 800 },
          { bank: 'BANK3', parcela: 100, saldoDevedor: 1000, valorLiberado: 800 },
          { bank: 'BANK4', parcela: 100, saldoDevedor: 1000, valorLiberado: 800 },
          { bank: 'BANK5', parcela: 100, saldoDevedor: 1000, valorLiberado: 800 }
        ],
        prazo: 96,
        seguro: 0,
        percentualConsultoria: 10
      };

      const errors = validateSimulationInput(input);
      expect(errors).toContain('Máximo de 4 bancos permitidos');
    });
  });

  describe('validateReferenceScenario', () => {
    it('should validate the reference scenario correctly', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'SANTANDER',
            parcela: 1000.00,
            saldoDevedor: 30000.00,
            valorLiberado: 22022.91
          }
        ],
        prazo: 96,
        coeficiente: '0,0192223',
        seguro: 1000.00,
        percentualConsultoria: 12.0
      };

      const result = computeTotals(input);
      const isValid = validateReferenceScenario(input, result);

      expect(result.liberadoCliente).toBe(14780.16);
      expect(isValid).toBe(true);
    });

    it('should return true for non-reference scenarios', () => {
      const input: SimulationInput = {
        banks: [
          {
            bank: 'BRADESCO',
            parcela: 500.00,
            saldoDevedor: 15000.00,
            valorLiberado: 12000.00
          }
        ],
        prazo: 60,
        coeficiente: '0,02',
        seguro: 500.00,
        percentualConsultoria: 10.0
      };

      const result = computeTotals(input);
      const isValid = validateReferenceScenario(input, result);

      expect(isValid).toBe(true); // Non-reference scenario, always valid
    });
  });
});