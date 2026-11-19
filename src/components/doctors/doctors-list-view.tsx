"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Eye, MoreHorizontal, Pencil, Plus, SearchX, Stethoscope, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { SpecializationBadge } from "@/components/shared/badges";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar, PAGE_SIZES } from "@/components/shared/pagination-bar";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { SearchInput } from "@/components/shared/search-input";
import { SortableHeader } from "@/components/shared/sortable-header";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { CardListSkeleton, TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SPECIALIZATIONS } from "@/constants/domain";
import { useUrlState } from "@/hooks/use-url-state";
import { doctorsApi, type DoctorListParams, type DoctorSortField } from "@/lib/api/doctors";
import { toApiRange } from "@/lib/date-range";
import { formatDate, pluralize } from "@/lib/format";
import { queryKeys } from "@/lib/queries/keys";
import { useDoctors } from "@/lib/queries/doctors";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types/api";
import type { Doctor } from "@/types/models";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ALL = "all";

/** URL → list state. `.catch()` makes malformed/hand-edited URLs fall back to defaults. */
const urlSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce
    .number()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(10),
  search: z.string().max(100).catch(""),
  specialization: z.enum(SPECIALIZATIONS).optional().catch(undefined),
  from: z.string().regex(DAY).optional().catch(undefined),
  to: z.string().regex(DAY).optional().catch(undefined),
  sortBy: z.enum(["createdAt", "name", "specialization", "hospital", "patientCount"]).catch("createdAt"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

export function DoctorsListView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState, resetState] = useUrlState(urlSchema);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);

  const params: DoctorListParams = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      search: state.search || undefined,
      specialization: state.specialization,
      sortBy: state.sortBy,
      order: state.order,
      ...toApiRange(state.from, state.to),
    }),
    [state],
  );

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useDoctors(params);
  const hasFilters = Boolean(state.search || state.specialization || state.from || state.to);

  // Prefetch the next page so paging feels instant.
  useEffect(() => {
    if (!data || isPlaceholderData || params.page >= data.meta.totalPages) return;
    const nextParams = { ...params, page: params.page + 1 };
    void queryClient.prefetchQuery({
      queryKey: queryKeys.doctors.list(nextParams),
      queryFn: ({ signal }) => doctorsApi.list(nextParams, signal),
    });
  }, [data, isPlaceholderData, params, queryClient]);

  // If the current page no longer exists (e.g. after deleting its last row), step back.
  useEffect(() => {
    if (data && !isPlaceholderData && state.page > data.meta.totalPages) {
      setState({ page: data.meta.totalPages }, { history: "replace" });
    }
  }, [data, isPlaceholderData, setState, state.page]);

  const onSearch = useCallback((search: string) => setState({ search }, { history: "replace" }), [setState]);
  const onSort = useCallback((sortBy: DoctorSortField, order: SortOrder) => setState({ sortBy, order }), [setState]);

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Doctors"
        description={data ? `${pluralize(data.meta.total, "doctor")}${hasFilters ? " match your filters" : " on staff"}` : "Manage your medical staff and their patients."}
        actions={
          <Button asChild>
            <Link href="/doctors/new">
              <Plus aria-hidden /> Add doctor
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 border-b p-3 sm:p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={state.search}
            onChange={onSearch}
            placeholder="Search name, email, hospital…"
            aria-label="Search doctors"
            className="lg:max-w-xs lg:flex-1"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={state.specialization ?? ALL}
              onValueChange={(value) => setState({ specialization: value === ALL ? undefined : value })}
            >
              <SelectTrigger className="h-9 w-full bg-card sm:w-52" aria-label="Filter by specialization">
                <Stethoscope className="text-muted-foreground" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All specializations</SelectItem>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangeFilter from={state.from} to={state.to} onChange={(range) => setState(range)} label="Joined date" />
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={resetState}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {isError ? (
          <ErrorState title="Couldn’t load doctors" error={error} onRetry={() => void refetch()} />
        ) : !isPending && items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No doctors match your filters"
              description="Try a different search term or clear the filters."
              action={
                <Button variant="outline" size="sm" onClick={resetState}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors yet"
              description="Add your first doctor to start assigning patients."
              action={
                <Button asChild size="sm">
                  <Link href="/doctors/new">
                    <Plus aria-hidden /> Add doctor
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <div className={cn("transition-opacity", isPlaceholderData && isFetching && "opacity-60")} aria-busy={isFetching}>
            {/* Desktop / tablet table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <SortableHeader field="name" label="Doctor" sortBy={state.sortBy} order={state.order} onSort={onSort} className="pl-4" />
                    <SortableHeader field="specialization" label="Specialization" sortBy={state.sortBy} order={state.order} onSort={onSort} />
                    <SortableHeader field="hospital" label="Hospital" sortBy={state.sortBy} order={state.order} onSort={onSort} className="hidden lg:table-cell" />
                    <SortableHeader field="patientCount" label="Patients" sortBy={state.sortBy} order={state.order} onSort={onSort} defaultOrder="desc" />
                    <SortableHeader field="createdAt" label="Joined" sortBy={state.sortBy} order={state.order} onSort={onSort} defaultOrder="desc" />
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                {isPending ? (
                  <TableSkeleton columns={6} rows={state.limit > 10 ? 10 : state.limit} />
                ) : (
                  <TableBody>
                    {items.map((doctor) => (
                      <TableRow
                        key={doctor._id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/doctors/${doctor._id}`)}
                      >
                        <TableCell className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={doctor.name} />
                            <div className="min-w-0">
                              <Link
                                href={`/doctors/${doctor._id}`}
                                className="block truncate font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {doctor.name}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground">{doctor.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SpecializationBadge value={doctor.specialization} />
                        </TableCell>
                        <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell">{doctor.hospital}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Users className="size-3.5 text-muted-foreground" aria-hidden />
                            {doctor.patientCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{formatDate(doctor.createdAt)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DoctorRowActions doctor={doctor} onDelete={() => setToDelete(doctor)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
                <span>Sort</span>
                <Select
                  value={`${state.sortBy}:${state.order}`}
                  onValueChange={(v) => {
                    const [sortBy, order] = v.split(":") as [DoctorSortField, SortOrder];
                    onSort(sortBy, order);
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-auto border-0 bg-transparent shadow-none" aria-label="Sort doctors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="createdAt:desc">Newest first</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                    <SelectItem value="name:asc">Name A–Z</SelectItem>
                    <SelectItem value="name:desc">Name Z–A</SelectItem>
                    <SelectItem value="patientCount:desc">Most patients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isPending ? (
                <CardListSkeleton />
              ) : (
                <ul className="divide-y">
                  {items.map((doctor) => (
                    <li key={doctor._id}>
                      <Link
                        href={`/doctors/${doctor._id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      >
                        <PersonAvatar name={doctor.name} className="size-9" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium">{doctor.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <SpecializationBadge value={doctor.specialization} />
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" aria-hidden />
                              {pluralize(doctor.patientCount, "patient")}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{doctor.hospital}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {data && data.meta.total > 0 && (
          <div className="border-t px-3 py-3 sm:px-4">
            <PaginationBar
              meta={data.meta}
              itemLabel="doctors"
              onPageChange={(page) => setState({ page })}
              onLimitChange={(limit) => setState({ limit })}
            />
          </div>
        )}
      </Card>

      <DeleteDoctorDialog doctor={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </>
  );
}

function DoctorRowActions({ doctor, onDelete }: { doctor: Doctor; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${doctor.name}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/doctors/${doctor._id}`}>
            <Eye aria-hidden /> View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/doctors/${doctor._id}/edit`}>
            <Pencil aria-hidden /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
