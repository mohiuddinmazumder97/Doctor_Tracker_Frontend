"use client";

import { ArrowDownRight, ArrowUpRight, Minus, Stethoscope, UserPlus, Users, UserRoundPlus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/shared/state-views";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardOverview } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";

/** Signed change vs last month; direction is shown with an icon + text, never color alone. */
function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const text = diff === 0 ? "No change" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}${pct !== null ? ` (${Math.abs(pct)}%)` : ""}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        diff > 0 && "text-success",
        diff < 0 && "text-destructive",
        diff === 0 && "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}

function Tile({ label, value, icon: Icon, footer }: { label: string; value: number; icon: LucideIcon; footer: ReactNode }) {
  return (
    <Card className="gap-2 px-4 py-4 sm:gap-3 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary sm:flex">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      {/* Proportional figures for big standalone numbers. */}
      <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{footer}</p>
    </Card>
  );
}

interface KpiTilesProps {
  data: DashboardOverview | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

export function KpiTiles({ data, isPending, isError, error, onRetry }: KpiTilesProps) {
  if (isError) {
    return (
      <Card>
        <ErrorState compact title="Couldn’t load summary statistics" error={error} onRetry={onRetry} />
      </Card>
    );
  }

  if (isPending || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-busy aria-label="Loading statistics">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>
    );
  }

  const { totals, thisMonth, lastMonth, averagePatientsPerDoctor } = data;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile
        label="Total doctors"
        value={totals.doctors}
        icon={Stethoscope}
        footer={<>{thisMonth.doctors > 0 ? `+${thisMonth.doctors} joined this month` : "No new doctors this month"}</>}
      />
      <Tile
        label="Total patients"
        value={totals.patients}
        icon={Users}
        footer={
          <>
            Avg <span className="font-medium text-foreground">{averagePatientsPerDoctor.toLocaleString()}</span> patients per doctor
          </>
        }
      />
      <Tile
        label="New doctors this month"
        value={thisMonth.doctors}
        icon={UserPlus}
        footer={
          <>
            <Delta current={thisMonth.doctors} previous={lastMonth.doctors} /> vs last month
          </>
        }
      />
      <Tile
        label="New patients this month"
        value={thisMonth.patients}
        icon={UserRoundPlus}
        footer={
          <>
            <Delta current={thisMonth.patients} previous={lastMonth.patients} /> vs last month
          </>
        }
      />
    </div>
  );
}
