"use client";

import { BarChart3, Table2, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: ReactNode;
  /** Plot height in px (including axis band) — skeleton and empty states keep the same height. */
  height: number;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  isEmpty: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  /** True while new data loads behind the previous render. */
  isRefreshing?: boolean;
  /** Extra header control (e.g. the trend granularity toggle). */
  headerControl?: ReactNode;
  /** The table-view twin of the chart (accessibility: every value reachable without color or hover). */
  table: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  height,
  isPending,
  isError,
  error,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyTitle = "No data for this period",
  emptyDescription = "Try a longer period, or add records to see analytics here.",
  isRefreshing = false,
  headerControl,
  table,
  children,
  footer,
  className,
}: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const showContent = !isPending && !isError && !isEmpty;

  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction className="flex items-center gap-2">
          {headerControl}
          {showContent && (
            <div role="group" aria-label={`${title} view`} className="flex rounded-lg border bg-muted/40 p-0.5">
              {(
                [
                  ["chart", BarChart3, "Chart view"],
                  ["table", Table2, "Table view"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    view === value && "bg-card text-foreground shadow-xs",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {isPending ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} aria-label="Loading chart" />
        ) : isError ? (
          <div className="flex items-center justify-center" style={{ minHeight: height }}>
            <ErrorState compact title="Couldn’t load this chart" error={error} onRetry={onRetry} />
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center" style={{ minHeight: height }}>
            <EmptyState compact icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          // Refetch keeps the frame: previous render stays, dimmed, until new data arrives.
          <div className={cn("transition-opacity", isRefreshing && "opacity-50")} aria-busy={isRefreshing}>
            {view === "chart" ? children : <div className="max-h-[22rem] overflow-y-auto">{table}</div>}
          </div>
        )}
      </CardContent>
      {footer && showContent && <div className="px-6 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
