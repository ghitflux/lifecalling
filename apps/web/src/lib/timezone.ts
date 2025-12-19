/* apps/web/src/lib/timezone.ts */

/**
 * Helper de timezone para horário de Brasília (America/Sao_Paulo)
 * UTC-3 (horário padrão) ou UTC-2 (horário de verão)
 */
export const BRASILIA_TIMEZONE = "America/Sao_Paulo";

/**
 * Converte uma data para o horário de Brasília
 */
export const toBrasiliaTime = (date: Date | string): Date => {
  const d = typeof date === 'string' ? (parseApiDate(date) ?? new Date(date)) : date;

  // Usar Intl para obter o horário correto considerando DST
  const brasiliaString = d.toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE });
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
const getBrasiliaDateParts = (date: Date | string) => {
  const d = typeof date === 'string'
    ? (parseApiDate(date) ?? new Date(normalizeApiDate(date)))
    : date;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
};

const buildBrasiliaDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number
) => {
  return new Date(year, month - 1, day, hour, minute, second, ms);
};

export const startOfDayBrasilia = (date: Date | string): Date => {
  const { year, month, day } = getBrasiliaDateParts(date);
  return buildBrasiliaDate(year, month, day, 0, 0, 0, 0);
};

/**
 * Retorna o fim do dia (23:59:59) no horário de Brasília
 */
export const endOfDayBrasilia = (date: Date | string): Date => {
  const start = startOfDayBrasilia(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
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
    timeZone: BRASILIA_TIMEZONE,
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
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Calcula primeiro dia do mês no horário de Brasília
 */
export const startOfMonthBrasilia = (date: Date | string): Date => {
  const { year, month } = getBrasiliaDateParts(date);
  return buildBrasiliaDate(year, month, 1, 0, 0, 0, 0);
};

/**
 * Calcula último dia do mês no horário de Brasília
 */
export const endOfMonthBrasilia = (date: Date | string): Date => {
  const { year, month } = getBrasiliaDateParts(date);
  const startNextMonth = buildBrasiliaDate(
    month === 12 ? year + 1 : year,
    month === 12 ? 1 : month + 1,
    1,
    0,
    0,
    0,
    0
  );
  return new Date(startNextMonth.getTime() - 1);
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

const normalizeApiDate = (value: string): string => {
  return value.trim().replace(" ", "T");
};

const hasTimezoneInfo = (value: string): boolean => {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
};

const isDateOnly = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

export const parseApiDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const normalized = normalizeApiDate(value);

  if (isDateOnly(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  const normalizedWithZone = hasTimezoneInfo(normalized)
    ? normalized
    : `${normalized}Z`;
  const date = new Date(normalizedWithZone);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};
