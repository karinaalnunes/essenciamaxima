import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formats an ISO date string to Brazilian format with time
 * Example: "10/01/2026 às 14:30"
 */
export function formatDateTimeBR(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    return formatInTimeZone(
      parseISO(isoString),
      BRAZIL_TIMEZONE,
      "dd/MM/yyyy 'às' HH:mm",
      { locale: ptBR }
    );
  } catch {
    return '-';
  }
}

/**
 * Formats an ISO date string to Brazilian date format (no time)
 * Example: "10/01/2026"
 */
export function formatDateBR(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    return formatInTimeZone(
      parseISO(isoString),
      BRAZIL_TIMEZONE,
      'dd/MM/yyyy',
      { locale: ptBR }
    );
  } catch {
    return '-';
  }
}

/**
 * Formats an ISO date string as relative time in Portuguese
 * Example: "há 3 dias", "há 2 horas"
 */
export function formatRelativeBR(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    const date = parseISO(isoString);
    const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
    
    return formatDistanceToNow(zonedDate, {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return '-';
  }
}

/**
 * Formats a compact date + relative time
 * Example: "10/01 (há 3 dias)"
 */
export function formatDateWithRelative(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    const date = parseISO(isoString);
    const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
    
    const dateFormatted = format(zonedDate, 'dd/MM', { locale: ptBR });
    const relative = formatDistanceToNow(zonedDate, {
      addSuffix: true,
      locale: ptBR,
    });
    
    return `${dateFormatted} (${relative})`;
  } catch {
    return '-';
  }
}
