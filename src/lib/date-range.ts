import { endOfDay, format, isValid, parse, startOfDay } from "date-fns";

/** Date filters are stored in the URL as local calendar days (yyyy-MM-dd). */
export const DAY_FORMAT = "yyyy-MM-dd";

export function parseDay(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, DAY_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

export function formatDay(date: Date | undefined): string | undefined {
  return date ? format(date, DAY_FORMAT) : undefined;
}

/**
 * Converts local calendar days into exact instants for the API, so "Nov 1 – Nov 30"
 * means the admin's own midnight-to-midnight, not UTC's.
 */
export function toApiRange(from?: string, to?: string): { from?: string; to?: string } {
  const fromDate = parseDay(from);
  const toDate = parseDay(to);
  return {
    from: fromDate ? startOfDay(fromDate).toISOString() : undefined,
    to: toDate ? endOfDay(toDate).toISOString() : undefined,
  };
}
