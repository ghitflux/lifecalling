/* apps/web/src/lib/timezone.ts */

/**
 * Helper de timezone para horário de Brasília (America/Sao_Paulo)
 *
 * Objetivo:
 * - Exibir datas/horas sempre em Brasília (UTC-3)
 * - Gerar strings ISO sem timezone para enviar à API (backend usa datetime "naive" em UTC)
 */

export const BRASILIA_TIMEZONE = "America/Sao_Paulo";

type DateParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const getPartsInTimeZone = (date: Date, timeZone: string): DateParts => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const parts = getPartsInTimeZone(date, timeZone);
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return (asUTC - date.getTime()) / 60000;
};

const makeDateInTimeZone = (parts: DateParts, timeZone: string): Date => {
  const utcGuess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
  );

  const offset1 = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  let result = new Date(utcGuess.getTime() - offset1 * 60_000);

  // Ajuste extra para transições de horário (DST)
  const offset2 = getTimeZoneOffsetMinutes(result, timeZone);
  if (offset2 !== offset1) {
    result = new Date(utcGuess.getTime() - offset2 * 60_000);
  }

  return result;
};

/**
 * Parse de datetime vindo da API:
 * - Se vier com timezone (Z ou ±HH:MM), usa parse normal
 * - Se vier sem timezone, assume UTC (backend usa datetime "naive" em UTC)
 */
export const parseApiDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;

  let raw = String(value).trim();
  if (!raw) return null;

  // Alguns endpoints podem devolver "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(raw)) {
    raw = raw.replace(" ", "T");
  }

  // ISO com timezone (Z ou ±HH:MM / ±HHMM)
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  if (hasTimezone) {
    const d = new Date(raw);
    return isValidDate(d) ? d : null;
  }

  // Date-only
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00-03:00`);
    return isValidDate(d) ? d : null;
  }

  // Datetime sem TZ -> assume UTC
  const d = new Date(`${raw}Z`);
  return isValidDate(d) ? d : null;
};

/**
 * Converte uma data para "horário de Brasília" (Date ajustado para exibição local).
 * Nota: Date não carrega timezone; isso apenas ajusta o timestamp para que os getters locais
 * retornem valores equivalentes ao horário de Brasília.
 */
export const toBrasiliaTime = (date: Date | string): Date => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return new Date(NaN);

  const localOffsetMinutes = -d.getTimezoneOffset();
  const brasiliaOffsetMinutes = getTimeZoneOffsetMinutes(d, BRASILIA_TIMEZONE);
  const diffMinutes = brasiliaOffsetMinutes - localOffsetMinutes;

  return new Date(d.getTime() + diffMinutes * 60_000);
};

/**
 * Formata data no formato YYYY-MM-DD no horário de Brasília
 */
export const formatDateBrasilia = (date: Date | string): string => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return "";
  const parts = getPartsInTimeZone(d, BRASILIA_TIMEZONE);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

/**
 * Retorna o início do dia (00:00:00) no horário de Brasília
 */
export const startOfDayBrasilia = (date: Date | string): Date => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return new Date(NaN);
  const parts = getPartsInTimeZone(d, BRASILIA_TIMEZONE);
  return makeDateInTimeZone(
    { ...parts, hour: 0, minute: 0, second: 0 },
    BRASILIA_TIMEZONE
  );
};

/**
 * Retorna o fim do dia (23:59:59.999) no horário de Brasília
 */
export const endOfDayBrasilia = (date: Date | string): Date => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return new Date(NaN);
  const parts = getPartsInTimeZone(d, BRASILIA_TIMEZONE);
  const end = makeDateInTimeZone(
    { ...parts, hour: 23, minute: 59, second: 59 },
    BRASILIA_TIMEZONE
  );
  end.setMilliseconds(999);
  return end;
};

/**
 * Retorna a data atual no horário de Brasília (Date ajustado para exibição local)
 */
export const nowBrasilia = (): Date => toBrasiliaTime(new Date());

/**
 * Converte Date para ISO string (UTC, sem timezone, para API)
 */
export const toISOBrasilia = (date: Date | string): string => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return "";
  return dateToISO(d);
};

/**
 * Formata data e hora no padrão brasileiro (dd/MM/yyyy HH:mm) em Brasília
 */
export const formatDateTimeBR = (date: Date | string): string => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return "";
  return d.toLocaleString("pt-BR", {
    timeZone: BRASILIA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formata apenas a data no padrão brasileiro (dd/MM/yyyy) em Brasília
 */
export const formatDateBR = (date: Date | string): string => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return "";
  return d.toLocaleDateString("pt-BR", {
    timeZone: BRASILIA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Calcula primeiro dia do mês no horário de Brasília
 */
export const startOfMonthBrasilia = (date: Date | string): Date => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return new Date(NaN);
  const parts = getPartsInTimeZone(d, BRASILIA_TIMEZONE);
  return makeDateInTimeZone(
    { ...parts, day: 1, hour: 0, minute: 0, second: 0 },
    BRASILIA_TIMEZONE
  );
};

/**
 * Calcula último dia do mês no horário de Brasília
 */
export const endOfMonthBrasilia = (date: Date | string): Date => {
  const d = parseApiDate(date) ?? new Date(date as any);
  if (!isValidDate(d)) return new Date(NaN);
  const parts = getPartsInTimeZone(d, BRASILIA_TIMEZONE);
  const end = makeDateInTimeZone(
    {
      ...parts,
      month: parts.month + 1,
      day: 0, // dia 0 do próximo mês = último do mês atual
      hour: 23,
      minute: 59,
      second: 59,
    },
    BRASILIA_TIMEZONE
  );
  end.setMilliseconds(999);
  return end;
};

/**
 * Converte Date para ISO sem timezone em UTC (YYYY-MM-DDTHH:mm:ss)
 * Útil para filtros de analytics (backend usa datetime "naive" em UTC).
 */
export const dateToISO = (date: Date): string => {
  if (!date || !isValidDate(date)) {
    console.warn("Invalid date provided to dateToISO:", date);
    return "";
  }
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;
};
