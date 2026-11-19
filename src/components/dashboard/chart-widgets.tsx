"use client";

import { Activity, LineChart, Stethoscope, Users } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RangeParams, TrendInterval } from "@/lib/api/dashboard";
import { formatBucketLabel } from "@/lib/dashboard-period";
import { pluralize } from "@/lib/format";
import {
  useConditionDistribution,
  useDoctorDistribution,
  usePatientTrends,
  useSpecializationDistribution,
} from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { ChartCard } from "./chart-card";
import type { DonutDatum, RankedBarDatum } from "./charts";

// Recharts is loaded on demand (client-only) — it never ships with the other pages.
const chartFallback = (height: number) => <Skeleton className="w-full rounded-lg" style={{ height }} />;
const TrendChart = dynamic(() => import("./charts").then((m) => m.TrendChart), { ssr: false, loading: () => chartFallback(360) });
const RankedBarChart = dynamic(() => import("./charts").then((m) => m.RankedBarChart), { ssr: false, loading: () => chartFallback(300) });
const DonutChart = dynamic(() => import("./charts").then((m) => m.DonutChart), { ssr: false, loading: () => chartFallback(208) });

// Mirrors rankedBarsHeight() in ./charts — duplicated so this module doesn't statically import Recharts.
const BAR_ROW = 34;
const barsHeight = (count: number) => Math.max(count, 1) * BAR_ROW + 8;

function DataTable({ head, rows }: { head: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={h} className={cn("text-xs", i > 0 && "text-right")}>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((cells, r) => (
          <TableRow key={r}>
            {cells.map((cell, i) => (
              <TableCell key={i} className={cn("py-2", i > 0 && "text-right tabular-nums")}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------------------------------------------------------------- registrations trend

const INTERVAL_LABELS: Record<TrendInterval, string> = { day: "Day", week: "Week", month: "Month" };

export function TrendWidget({
  range,
  interval,
  allowed,
  onIntervalChange,
  className,
}: {
  range: RangeParams;
  interval: TrendInterval;
  allowed: TrendInterval[];
  onIntervalChange: (interval: TrendInterval) => void;
  className?: string;
}) {
  const query = usePatientTrends({ ...range, interval });
  const data = query.data;
  const height = 360;

  return (
    <ChartCard
      className={className}
      title="Patient registrations"
      description={data ? `${pluralize(data.total, "new patient")} in this period` : "New patients over time"}
      height={height}
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={!data || data.total === 0}
      emptyIcon={LineChart}
      emptyTitle="No registrations in this period"
      isRefreshing={query.isPlaceholderData && query.isFetching}
      headerControl={
        <div role="radiogroup" aria-label="Granularity" className="hidden rounded-lg border bg-muted/40 p-0.5 sm:flex">
          {(["day", "week", "month"] as const).map((value) => {
            const enabled = allowed.includes(value);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={interval === value}
                disabled={!enabled}
                onClick={() => onIntervalChange(value)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
                  interval === value && "bg-card text-foreground shadow-xs",
                )}
              >
                {INTERVAL_LABELS[value]}
              </button>
            );
          })}
        </div>
      }
      table={
        data && (
          <DataTable
            head={["Period", "Registrations"]}
            rows={[...data.points].reverse().map((p, i) => [
              `${formatBucketLabel(p.bucket, data.interval)}${i === 0 ? " (to date)" : ""}`,
              p.count.toLocaleString(),
            ])}
          />
        )
      }
    >
      {data && <TrendChart points={data.points} interval={data.interval} height={height} />}
    </ChartCard>
  );
}

// ---------------------------------------------------------------- patients per doctor

export function DoctorDistributionWidget({ range, className }: { range: RangeParams; className?: string }) {
  const query = useDoctorDistribution({ ...range, limit: 8 });
  const data = query.data;
  const bars: RankedBarDatum[] = (data?.items ?? []).map((d) => ({
    id: d.doctorId,
    label: d.name,
    sublabel: d.specialization,
    value: d.patientCount,
    href: `/doctors/${d.doctorId}`,
  }));

  return (
    <ChartCard
      className={className}
      title="Patients per doctor"
      description={
        data && data.doctorsWithPatients > 0
          ? `Avg ${(data.totalPatients / data.doctorsWithPatients).toFixed(1)} new patients per active doctor`
          : "Top doctors by new patients"
      }
      height={barsHeight(8)}
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={!data || data.items.length === 0}
      emptyIcon={Users}
      isRefreshing={query.isPlaceholderData && query.isFetching}
      table={
        data && (
          <DataTable
            head={["Doctor", "Patients"]}
            rows={[
              ...data.items.map((d) => [
                <Link key={d.doctorId} href={`/doctors/${d.doctorId}`} className="hover:underline">
                  {d.name}
                </Link>,
                d.patientCount.toLocaleString(),
              ]),
              ...(data.otherPatients > 0 ? [["All other doctors", data.otherPatients.toLocaleString()]] : []),
            ]}
          />
        )
      }
      footer={
        data && data.otherPatients > 0
          ? `Top ${data.items.length} of ${data.doctorsWithPatients} doctors · ${pluralize(data.otherPatients, "patient")} with other doctors. Click a bar to open the doctor.`
          : "Click a bar to open the doctor."
      }
    >
      <RankedBarChart data={bars} valueLabel={["patient", "patients"]} />
    </ChartCard>
  );
}

// ---------------------------------------------------------------- conditions (donut, ≤ 6 segments)

const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const TOP_CONDITIONS = 5;

export function ConditionWidget({ range, className }: { range: RangeParams; className?: string }) {
  const query = useConditionDistribution(range);
  const data = query.data;
  const total = data?.total ?? 0;

  // Top 5 keep fixed slot colors by rank-in-this-view; the long tail folds into a neutral "Other"
  // (a donut stays legible only up to ~6 segments). The table view lists every condition.
  const top = data?.items.slice(0, TOP_CONDITIONS) ?? [];
  const rest = data?.items.slice(TOP_CONDITIONS) ?? [];
  const otherCount = rest.reduce((sum, d) => sum + d.count, 0);
  const segments: DonutDatum[] = [
    ...top.map((d, i) => ({ name: d.condition, value: d.count, color: SLOT_COLORS[i]! })),
    ...(otherCount > 0 ? [{ name: `Other (${rest.length} conditions)`, value: otherCount, color: "var(--chart-other)" }] : []),
  ];
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  return (
    <ChartCard
      className={className}
      title="Medical conditions"
      description="Share of patients registered in this period"
      height={220}
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={total === 0}
      emptyIcon={Activity}
      isRefreshing={query.isPlaceholderData && query.isFetching}
      table={
        data && (
          <DataTable
            head={["Condition", "Patients", "Share"]}
            rows={data.items.map((d) => [d.condition, d.count.toLocaleString(), pct(d.count)])}
          />
        )
      }
    >
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,13rem)_1fr] lg:grid-cols-1 2xl:grid-cols-[minmax(0,13rem)_1fr]">
        <DonutChart data={segments} total={total} centerLabel="patients" />
        {/* Legend with values: identity never relies on color alone, and covers the light-mode
            sub-3:1 slots (the validator's "relief" requirement). */}
        <ul className="space-y-2" aria-label="Condition breakdown">
          {segments.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5 text-sm">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="font-medium tabular-nums">{s.value.toLocaleString()}</span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{pct(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------- doctors by specialization

export function SpecializationWidget({ range, className }: { range: RangeParams; className?: string }) {
  const query = useSpecializationDistribution(range);
  const data = query.data;
  const bars: RankedBarDatum[] = (data?.items ?? []).map((d) => ({
    id: d.specialization,
    label: d.specialization,
    value: d.doctorCount,
    detail: `${pluralize(d.patientCount, "patient")} in total`,
    href: `/doctors?specialization=${encodeURIComponent(d.specialization)}`,
  }));

  return (
    <ChartCard
      className={className}
      title="Doctors by specialization"
      description={data ? `${pluralize(data.totalDoctors, "doctor")} joined in this period` : "Specialty mix of your staff"}
      height={barsHeight(Math.max(bars.length, 6))}
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={!data || data.items.length === 0}
      emptyIcon={Stethoscope}
      emptyTitle="No doctors joined in this period"
      isRefreshing={query.isPlaceholderData && query.isFetching}
      table={
        data && (
          <DataTable
            head={["Specialization", "Doctors", "Patients"]}
            rows={data.items.map((d) => [d.specialization, d.doctorCount.toLocaleString(), d.patientCount.toLocaleString()])}
          />
        )
      }
      footer="Click a bar to see those doctors."
    >
      <RankedBarChart data={bars} valueLabel={["doctor", "doctors"]} />
    </ChartCard>
  );
}
