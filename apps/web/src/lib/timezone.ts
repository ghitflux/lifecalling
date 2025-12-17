/* apps/web/src/lib/timezone.ts */

/**
 * Helper de timezone para horário de Brasília (America/Sao_Paulo)
 * UTC-3 (horário padrão) ou UTC-2 (horário de verão)
 */

/**
 * Converte uma data para o horário de Brasília
 */
export const toBrasiliaTime = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Usar Intl para obter o horário correto considerando DST
  const brasiliaString = d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaString);
};

/**
 * Formata data no formato YYYY-MM-DD no horário de Brasília
 */
export const formatDateBrasilia = (date: Date | string): string => {
  const d = toBrasiliaTime(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna o início do dia (00:00:00) no horário de Brasília
 */
export const startOfDayBrasilia = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return localDate;
};

/**
 * Retorna o fim do dia (23:59:59) no horário de Brasília
 */
export const endOfDayBrasilia = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return localDate;
};

/**
 * Retorna a data atual no horário de Brasília
 */
export const nowBrasilia = (): Date => {
  return toBrasiliaTime(new Date());
};

/**
 * Converte Date para ISO string no horário de Brasília
 */
export const toISOBrasilia = (date: Date | string): string => {
  return toBrasiliaTime(date).toISOString();
};

/**
 * Formata data e hora no padrão brasileiro (dd/MM/yyyy HH:mm)
 */
export const formatDateTimeBR = (date: Date | string): string => {
  const d = toBrasiliaTime(date);
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata apenas a data no padrão brasileiro (dd/MM/yyyy)
 */
export const formatDateBR = (date: Date | string): string => {
  const d = toBrasiliaTime(date);
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Calcula primeiro dia do mês no horário de Brasília
 */
export const startOfMonthBrasilia = (date: Date | string): Date => {
  const d = toBrasiliaTime(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
};

/**
 * Calcula último dia do mês no horário de Brasília
 */
export const endOfMonthBrasilia = (date: Date | string): Date => {
  const d = toBrasiliaTime(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Wrapper para uso simples - converte data local para ISO mantendo horário local
 * Útil para formulários onde queremos manter o horário digitado pelo usuário
 */
export const dateToISO = (date: Date): string => {
  // Verifica se a data é válida
  if (!date || isNaN(date.getTime())) {
    console.warn('Invalid date provided to dateToISO:', date);
    return new Date().toISOString(); // Retorna data atual como fallback
  }
  return date.toISOString();
};
