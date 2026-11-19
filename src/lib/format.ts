import { differenceInYears, format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** "Nov 19, 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? format(date, "MMM d, yyyy") : "—";
}

/** "Nov 19, 2026, 3:42 PM" */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? format(date, "MMM d, yyyy, h:mm a") : "—";
}

/** "3 days ago" */
export function formatRelative(value: string | Date | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? `${formatDistanceToNowStrict(date)} ago` : "—";
}

/**
 * Date of birth is a calendar date stored as UTC midnight. Format it in UTC so
 * users west of Greenwich don't see the previous day.
 */
export function formatDateOfBirth(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function ageFromDateOfBirth(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = toDate(value);
  return date ? differenceInYears(new Date(), date) : null;
}

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}
