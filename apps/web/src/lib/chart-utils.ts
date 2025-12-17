/**
 * Utilitários para conversão de dados reais em formato de mini-charts
 */

export interface MiniChartDataPoint {
  day: string;
  value: number;
}

export interface SeriesDataPoint {
  date: string;
  [key: string]: any;
}

/**
 * Converte dados de série temporal em formato de mini-chart
 */
export function convertSeriesToMiniChart(
  seriesData: SeriesDataPoint[],
  valueKey: string,
  fallbackData?: MiniChartDataPoint[]
): MiniChartDataPoint[] {
  if (!seriesData || seriesData.length === 0) {
    return fallbackData || generateEmptyData();
  }

  return seriesData.map((item, index) => ({
    day: `D${index + 1}`,
    value: item[valueKey] || 0,
  }));
}

/**
 * Gera dados vazios para quando não há dados reais
 */
export function generateEmptyData(length: number = 7): MiniChartDataPoint[] {
  return Array.from({ length }, (_, index) => ({
    day: `D${index + 1}`,
    value: 0,
  }));
}

/**
 * Converte dados de KPIs em formato de mini-chart baseado em tendências
 */
export function convertKpiTrendToMiniChart(
  currentValue: number,
  trend: number,
  length: number = 7
): MiniChartDataPoint[] {
  if (currentValue === 0 && trend === 0) {
    return generateEmptyData(length);
  }

  const data: MiniChartDataPoint[] = [];
  const baseValue = currentValue;
  const trendFactor = trend / 100; // Converter porcentagem para fator

  for (let i = 0; i < length; i++) {
    // Simular uma progressão baseada na tendência
    const progress = i / (length - 1); // 0 a 1
    const variation = Math.sin(progress * Math.PI * 2) * 0.1; // Variação suave
    const trendValue = baseValue * (1 - trendFactor * (1 - progress));
    const value = Math.max(0, trendValue * (1 + variation));
    
    data.push({
      day: `D${i + 1}`,
      value: Math.round(value * 100) / 100, // Arredondar para 2 casas decimais
    });
  }

  return data;
}

/**
 * Converte dados financeiros em formato de mini-chart
 */
export function convertFinanceToMiniChart(
  seriesData: SeriesDataPoint[],
  valueKey: string,
  fallbackValue: number = 0
): MiniChartDataPoint[] {
  if (!seriesData || seriesData.length === 0) {
    return generateEmptyData().map((item, index) => ({
      ...item,
      value: fallbackValue * (0.8 + Math.random() * 0.4), // Variação de ±20%
    }));
  }

  return convertSeriesToMiniChart(seriesData, valueKey);
}

/**
 * Converte dados de atendimento em formato de mini-chart
 */
export function convertAttendanceToMiniChart(
  seriesData: SeriesDataPoint[],
  valueKey: string
): MiniChartDataPoint[] {
  return convertSeriesToMiniChart(seriesData, valueKey);
}

/**
 * Converte dados de simulações em formato de mini-chart
 */
export function convertSimulationsToMiniChart(
  seriesData: SeriesDataPoint[],
  valueKey: string
): MiniChartDataPoint[] {
  return convertSeriesToMiniChart(seriesData, valueKey);
}

/**
 * Converte dados de contratos em formato de mini-chart
 */
export function convertContractsToMiniChart(
  seriesData: SeriesDataPoint[],
  valueKey: string
): MiniChartDataPoint[] {
  return convertSeriesToMiniChart(seriesData, valueKey);
}

/**
 * Gera dados de fallback baseados em um valor atual e tendência
 */
export function generateFallbackTrendData(
  currentValue: number,
  trend: number = 0,
  length: number = 7
): MiniChartDataPoint[] {
  if (currentValue === 0) {
    return generateEmptyData(length);
  }

  return convertKpiTrendToMiniChart(currentValue, trend, length);
}