import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardListSkeleton } from "./table-skeleton";

export function ListPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card className="gap-0 py-0">
        <div className="flex gap-2 border-b p-4">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="hidden h-9 w-52 sm:block" />
        </div>
        <CardListSkeleton rows={6} />
      </Card>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
