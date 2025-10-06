// Utilitários para formatação de moeda BRL

export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export const parseCurrency = (value: string, allowNegative: boolean = false): number => {
  // Garantir que value é uma string
  const stringValue = String(value || '');
  
  // Detectar se o valor é negativo
  const isNegative = stringValue.includes('-');
  
  // Remove R$, espaços, pontos de milhares, sinais negativos e substitui vírgula por ponto
  const cleanValue = stringValue
    .replace(/R\$\s?/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const numericValue = parseFloat(cleanValue) || 0;
  
  // Aplicar sinal negativo se detectado e permitido
  return (isNegative && allowNegative) ? -numericValue : Math.abs(numericValue);
};

export const formatCurrencyInput = (value: string, allowNegative: boolean = false): string => {
  // Garantir que value é uma string
  const stringValue = String(value || '');
  
  // Detectar se o valor é negativo
  const isNegative = stringValue.includes('-');
  
  // Remove caracteres não numéricos (exceto o sinal negativo se permitido)
  const numbers = stringValue.replace(/[^\d]/g, '');

  if (!numbers) return '';

  // Converte para centavos
  const cents = parseInt(numbers);
  const reais = cents / 100;
  
  // Aplicar sinal negativo se detectado e permitido
  const finalValue = (isNegative && allowNegative) ? -reais : Math.abs(reais);

  return formatCurrency(finalValue);
};

export const calculateValorLiberado = (parcela: number, coeficiente: number, saldoDevedor: number): number => {
  // Fórmula: Parcela / Coeficiente - Saldo Devedor
  if (coeficiente === 0) {
    return 0; // Evita divisão por zero
  }
  
  return (parcela / coeficiente) - saldoDevedor;
};

export const validateCoeficiente = (coeficiente: string): boolean => {
  const num = parseFloat(coeficiente.replace(',', '.'));
  return !isNaN(num) && num > 0;
};