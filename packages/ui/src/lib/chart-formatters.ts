/* packages/ui/src/lib/chart-formatters.ts */

/**
 * Formata uma data ISO para o formato brasileiro abreviado
 * @param dateString - Data no formato ISO (ex: "2025-10-03T00:00:00")
 * @returns Data formatada (ex: "10 de Out.")
 */
export function formatDateForChart(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate();
    const monthNames = [
      'Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.',
      'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'
    ];
    const month = monthNames[date.getMonth()];
    
    return `${day} de ${month}`;
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Formata um valor monetário para o formato brasileiro
 * @param value - Valor numérico
 * @param options - Opções de formatação
 * @returns Valor formatado (ex: "R$ 1.234,56")
 */
export function formatCurrencyForChart(
  value: number, 
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  } = {}
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false
  } = options;
  
  // Se compact for true, usar formato abreviado para valores grandes
  if (compact) {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })}K`;
    }
  }
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits
  });
}

/**
 * Formata um valor numérico para exibição em gráficos
 * @param value - Valor numérico
 * @param type - Tipo de formatação ('currency', 'percentage', 'number')
 * @returns Valor formatado
 */
export function formatValueForChart(
  value: number, 
  type: 'currency' | 'percentage' | 'number' = 'number'
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return type === 'currency' ? 'R$ 0,00' : '0';
  }
  
  switch (type) {
    case 'currency':
      return formatCurrencyForChart(value);
    case 'percentage':
      return `${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })}%`;
    case 'number':
    default:
      return value.toLocaleString('pt-BR');
  }
}

/**
 * Cria um formatter customizado para tooltips
 * @param type - Tipo de formatação
 * @returns Função formatter para usar em tooltips
 */
export function createTooltipFormatter(type: 'currency' | 'percentage' | 'number' = 'number') {
  return (value: number) => formatValueForChart(value, type);
}