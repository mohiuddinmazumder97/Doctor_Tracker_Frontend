import { differenceInCalendarDays, format, parse, startOfDay, startOfYear, subDays, subMonths } from "date-fns";
import type { TrendInterval } from "@/lib/api/dashboard";

export const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

/** Start of the period at the admin's local midnight (sent to the API as an exact instant). */
export function periodStart(period: PeriodValue, now = new Date()): Date {
  switch (period) {
    case "7d":
      return startOfDay(subDays(now, 6));
    case "30d":
      return startOfDay(subDays(now, 29));
    case "90d":
      return startOfDay(subDays(now, 89));
    case "6m":
      return startOfDay(subMonths(now, 6));
    case "12m":
      // 12 whole calendar months including the current one.
      return startOfDay(new Date(now.getFullYear(), now.getMonth() - 11, 1));
    case "ytd":
      return startOfYear(now);
  }
}

/** Granularities that produce a readable number of points for a period. */
export function allowedIntervals(period: PeriodValue, now = new Date()): TrendInterval[] {
  const days = differenceInCalendarDays(now, periodStart(period, now)) + 1;
  const intervals: TrendInterval[] = [];
  if (days <= 92) intervals.push("day");
  if (days >= 14) intervals.push("week");
  if (days >= 60) intervals.push("month");
  return intervals;
}

export function defaultInterval(period: PeriodValue): TrendInterval {
  return period === "7d" || period === "30d" ? "day" : period === "90d" || period === "6m" ? "week" : "month";
}

function bucketDate(bucket: string) {
  return parse(bucket, "yyyy-MM-dd", new Date());
}

/** Short axis label for a bucket. */
export function formatBucketTick(bucket: string, interval: TrendInterval, spansYears: boolean) {
  const date = bucketDate(bucket);
  if (interval === "month") return format(date, spansYears ? "MMM yy" : "MMM");
  return format(date, "MMM d");
}

/** Full tooltip label for a bucket. */
export function formatBucketLabel(bucket: string, interval: TrendInterval) {
  const date = bucketDate(bucket);
  if (interval === "month") return format(date, "MMMM yyyy");
  if (interval === "week") return `Week of ${format(date, "MMM d, yyyy")}`;
  return format(date, "EEE, MMM d, yyyy");
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
