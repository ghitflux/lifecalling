// Utilitários centralizados para formatação de moeda

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove todos os caracteres que não são dígitos
  const cleanValue = value.replace(/\D/g, '');
  
  if (!cleanValue) return 0;
  
  // Converte para número dividindo por 100 (centavos)
  const result = parseFloat(cleanValue) / 100;
  
  // Garante que o resultado é um número válido
  if (isNaN(result) || !isFinite(result)) {
    return 0;
  }
  
  return result;
};

export const formatCurrencyInput = (value: string): string => {
  if (!value) return '';
  
  // Remove todos os caracteres que não são dígitos
  const cleanValue = value.replace(/\D/g, '');
  
  if (!cleanValue) return '';
  
  // Converte para número e formata como moeda
  const numericValue = parseFloat(cleanValue) / 100;
  return formatCurrency(numericValue);
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};