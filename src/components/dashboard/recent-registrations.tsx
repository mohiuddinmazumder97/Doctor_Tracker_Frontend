"use client";

import { ArrowRight, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { ConditionBadge, SpecializationBadge } from "@/components/shared/badges";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardOverview } from "@/lib/api/dashboard";
import { formatRelative } from "@/lib/format";

interface RecentProps {
  data: DashboardOverview | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              View all <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function RecentDoctors({ data, isPending, isError, error, onRetry }: RecentProps) {
  return (
    <RecentCard title="Recent doctor registrations" href="/doctors">
      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : !data?.recentDoctors.length ? (
        <EmptyState compact icon={Stethoscope} title="No doctors yet" />
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {data.recentDoctors.map((d) => (
            <li key={d._id}>
              <Link href={`/doctors/${d._id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                <PersonAvatar name={d.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.hospital}</p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <SpecializationBadge value={d.specialization} />
                  <span className="text-xs text-muted-foreground">{formatRelative(d.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RecentCard>
  );
}

export function RecentPatients({ data, isPending, isError, error, onRetry }: RecentProps) {
  return (
    <RecentCard title="Recent patient registrations" href="/patients">
      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : !data?.recentPatients.length ? (
        <EmptyState compact icon={Users} title="No patients yet" />
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {data.recentPatients.map((p) => (
            <li key={p._id}>
              <Link href={`/patients/${p._id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                <PersonAvatar name={p.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.doctor ? `with ${p.doctor.name}` : "Unassigned"}</p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <ConditionBadge value={p.condition} />
                  <span className="text-xs text-muted-foreground">{formatRelative(p.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RecentCard>
  );
}
