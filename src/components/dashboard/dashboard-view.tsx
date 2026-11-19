"use client";

import { CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import type { RangeParams } from "@/lib/api/dashboard";
import { allowedIntervals, browserTimeZone, defaultInterval, PERIODS, periodStart } from "@/lib/dashboard-period";
import { useDashboardOverview } from "@/lib/queries/dashboard";
import { ConditionWidget, DoctorDistributionWidget, SpecializationWidget, TrendWidget } from "./chart-widgets";
import { KpiTiles } from "./kpi-tiles";
import { RecentDoctors, RecentPatients } from "./recent-registrations";

const urlSchema = z.object({
  period: z.enum(PERIODS.map((p) => p.value) as [string, ...string[]]).catch("12m"),
  interval: z.enum(["day", "week", "month"]).optional().catch(undefined),
});

export function DashboardView() {
  const [state, setState] = useUrlState(urlSchema);
  const period = state.period as (typeof PERIODS)[number]["value"];
  // The admin's own time zone decides what "this month" and each day/week bucket mean.
  const [tz] = useState(browserTimeZone);

  const allowed = useMemo(() => allowedIntervals(period), [period]);
  const interval = state.interval && allowed.includes(state.interval) ? state.interval : defaultInterval(period);

  // Recomputed only when the period changes, so the query key (and cache) stays stable.
  const range: RangeParams = useMemo(() => ({ from: periodStart(period).toISOString(), tz }), [period, tz]);

  const overview = useDashboardOverview(tz);
  const overviewProps = {
    data: overview.data,
    isPending: overview.isPending,
    isError: overview.isError,
    error: overview.error,
    onRetry: () => void overview.refetch(),
  };

  return (
    // flex + gap (not space-y): a child margin such as PageHeader’s can’t collapse the spacing.
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0 lg:mb-0"
        title="Dashboard"
        description="Live overview of your doctors, patients and registrations."
      />

      <KpiTiles {...overviewProps} />

      {/* One filter row above everything it scopes: all charts re-render against the same period. */}
      <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Registrations in the selected period · times in {tz.replace(/_/g, " ")}</p>
        </div>
        <Select value={period} onValueChange={(value) => setState({ period: value, interval: undefined })}>
          <SelectTrigger className="h-9 w-full bg-card sm:w-48" aria-label="Analytics period">
            <CalendarRange className="text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TrendWidget
          className="lg:col-span-2"
          range={range}
          interval={interval}
          allowed={allowed}
          onIntervalChange={(next) => setState({ interval: next })}
        />
        <ConditionWidget range={range} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DoctorDistributionWidget range={range} />
        <SpecializationWidget range={range} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentDoctors {...overviewProps} />
        <RecentPatients {...overviewProps} />
      </div>
    </div>
  );
}
