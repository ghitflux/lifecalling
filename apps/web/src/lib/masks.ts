/**
 * Funções de máscara para campos de formulário
 */

/**
 * Formata um telefone brasileiro
 * Aceita formatos: (11) 99999-9999 ou (11) 9999-9999
 */
export function formatPhone(value: string): string {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara conforme o tamanho
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    // Celular com 9 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * Remove a máscara do telefone, mantendo apenas os números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida se o telefone está completo
 */
export function isValidPhone(value: string): boolean {
  const numbers = unformatPhone(value);
  return numbers.length === 10 || numbers.length === 11;
}

/**
 * Formata CPF
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata porcentagem
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
