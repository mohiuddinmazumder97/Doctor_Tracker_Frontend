"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, SearchX, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { DoctorSelect } from "@/components/patients/doctor-select";
import { ConditionBadge } from "@/components/shared/badges";
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
import { GENDER_LABELS, GENDERS, MEDICAL_CONDITIONS } from "@/constants/domain";
import { useUrlState } from "@/hooks/use-url-state";
import { patientsApi, type PatientListParams, type PatientSortField } from "@/lib/api/patients";
import { toApiRange } from "@/lib/date-range";
import { ageFromDateOfBirth, formatDate, pluralize } from "@/lib/format";
import { queryKeys } from "@/lib/queries/keys";
import { usePatients } from "@/lib/queries/patients";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types/api";
import type { PatientListItem } from "@/types/models";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ALL = "all";

const urlSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce
    .number()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(10),
  search: z.string().max(100).catch(""),
  doctorId: z.string().regex(/^[a-f\d]{24}$/i).optional().catch(undefined),
  condition: z.enum(MEDICAL_CONDITIONS).optional().catch(undefined),
  gender: z.enum(GENDERS).optional().catch(undefined),
  from: z.string().regex(DAY).optional().catch(undefined),
  to: z.string().regex(DAY).optional().catch(undefined),
  sortBy: z.enum(["createdAt", "fullName", "dateOfBirth", "condition"]).catch("createdAt"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

export function PatientsListView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState, resetState] = useUrlState(urlSchema);
  const [toDelete, setToDelete] = useState<PatientListItem | null>(null);

  const params: PatientListParams = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      search: state.search || undefined,
      doctorId: state.doctorId,
      condition: state.condition,
      gender: state.gender,
      sortBy: state.sortBy,
      order: state.order,
      ...toApiRange(state.from, state.to),
    }),
    [state],
  );

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = usePatients(params);
  const hasFilters = Boolean(state.search || state.doctorId || state.condition || state.gender || state.from || state.to);

  useEffect(() => {
    if (!data || isPlaceholderData || params.page >= data.meta.totalPages) return;
    const nextParams = { ...params, page: params.page + 1 };
    void queryClient.prefetchQuery({
      queryKey: queryKeys.patients.list(nextParams),
      queryFn: ({ signal }) => patientsApi.list(nextParams, signal),
    });
  }, [data, isPlaceholderData, params, queryClient]);

  useEffect(() => {
    if (data && !isPlaceholderData && state.page > data.meta.totalPages) {
      setState({ page: data.meta.totalPages }, { history: "replace" });
    }
  }, [data, isPlaceholderData, setState, state.page]);

  const onSearch = useCallback((search: string) => setState({ search }, { history: "replace" }), [setState]);
  const onSort = useCallback((sortBy: PatientSortField, order: SortOrder) => setState({ sortBy, order }), [setState]);
  const sortProps = { sortBy: state.sortBy, order: state.order, onSort };

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Patients"
        description={
          data
            ? `${pluralize(data.meta.total, "patient")}${hasFilters ? " match your filters" : " registered"}`
            : "Search, filter and manage patient records."
        }
        actions={
          <Button asChild>
            <Link href={state.doctorId ? `/patients/new?doctorId=${state.doctorId}` : "/patients/new"}>
              <Plus aria-hidden /> Add patient
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-2 border-b p-3 sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={state.search}
              onChange={onSearch}
              placeholder="Search name, email or phone…"
              aria-label="Search patients"
              className="lg:max-w-xs lg:flex-1"
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
              <DoctorSelect
                value={state.doctorId ?? ""}
                onChange={(doctor) => setState({ doctorId: doctor._id })}
                placeholder="All doctors"
                clearOption={{ label: "All doctors", onClear: () => setState({ doctorId: undefined }) }}
                className="lg:w-56"
              />
              <Select
                value={state.condition ?? ALL}
                onValueChange={(value) => setState({ condition: value === ALL ? undefined : value })}
              >
                <SelectTrigger className="h-9 w-full bg-card lg:w-48" aria-label="Filter by medical condition">
                  <Activity className="text-muted-foreground" aria-hidden />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All conditions</SelectItem>
                  {MEDICAL_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={state.gender ?? ALL} onValueChange={(value) => setState({ gender: value === ALL ? undefined : value })}>
              <SelectTrigger className="h-9 w-full bg-card sm:w-40" aria-label="Filter by gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All genders</SelectItem>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangeFilter from={state.from} to={state.to} onChange={(range) => setState(range)} label="Registered date" />
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={resetState}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {isError ? (
          <ErrorState title="Couldn’t load patients" error={error} onRetry={() => void refetch()} />
        ) : !isPending && items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No patients match your filters"
              description="Try a different search term or clear the filters."
              action={
                <Button variant="outline" size="sm" onClick={resetState}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No patients yet"
              description="Register your first patient and assign them to a doctor."
              action={
                <Button asChild size="sm">
                  <Link href="/patients/new">
                    <Plus aria-hidden /> Add patient
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <div className={cn("transition-opacity", isPlaceholderData && isFetching && "opacity-60")} aria-busy={isFetching}>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <SortableHeader field="fullName" label="Patient" {...sortProps} className="pl-4" />
                    <SortableHeader field="condition" label="Condition" {...sortProps} />
                    <TableHead className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Doctor</TableHead>
                    <SortableHeader field="dateOfBirth" label="Age" {...sortProps} defaultOrder="desc" className="hidden lg:table-cell" />
                    <SortableHeader field="createdAt" label="Registered" {...sortProps} defaultOrder="desc" />
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                {isPending ? (
                  <TableSkeleton columns={6} rows={Math.min(state.limit, 10)} />
                ) : (
                  <TableBody>
                    {items.map((patient) => {
                      const age = ageFromDateOfBirth(patient.dateOfBirth);
                      return (
                        <TableRow key={patient._id} className="cursor-pointer" onClick={() => router.push(`/patients/${patient._id}`)}>
                          <TableCell className="py-3 pl-4">
                            <div className="flex items-center gap-3">
                              <PersonAvatar name={patient.fullName} />
                              <div className="min-w-0">
                                <Link
                                  href={`/patients/${patient._id}`}
                                  className="block truncate font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {patient.fullName}
                                </Link>
                                <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ConditionBadge value={patient.condition} />
                          </TableCell>
                          <TableCell className="max-w-48" onClick={(e) => e.stopPropagation()}>
                            {patient.doctor ? (
                              <Link href={`/doctors/${patient.doctor._id}`} className="block truncate text-sm hover:underline">
                                {patient.doctor.name}
                                <span className="block truncate text-xs text-muted-foreground">{patient.doctor.specialization}</span>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                            {age ?? "—"} · {GENDER_LABELS[patient.gender]}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{formatDate(patient.createdAt)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <PatientRowActions patient={patient} onDelete={() => setToDelete(patient)} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                )}
              </Table>
            </div>

            <div className="md:hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
                <span>Sort</span>
                <Select
                  value={`${state.sortBy}:${state.order}`}
                  onValueChange={(v) => {
                    const [sortBy, order] = v.split(":") as [PatientSortField, SortOrder];
                    onSort(sortBy, order);
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-auto border-0 bg-transparent shadow-none" aria-label="Sort patients">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="createdAt:desc">Newest first</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                    <SelectItem value="fullName:asc">Name A–Z</SelectItem>
                    <SelectItem value="fullName:desc">Name Z–A</SelectItem>
                    <SelectItem value="dateOfBirth:desc">Youngest first</SelectItem>
                    <SelectItem value="dateOfBirth:asc">Oldest patients first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isPending ? (
                <CardListSkeleton />
              ) : (
                <ul className="divide-y">
                  {items.map((patient) => (
                    <li key={patient._id}>
                      <Link
                        href={`/patients/${patient._id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      >
                        <PersonAvatar name={patient.fullName} className="size-9" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium">{patient.fullName}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <ConditionBadge value={patient.condition} />
                            <span>
                              {ageFromDateOfBirth(patient.dateOfBirth) ?? "—"} · {GENDER_LABELS[patient.gender]}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{patient.doctor?.name ?? "Unassigned"}</p>
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
              itemLabel="patients"
              onPageChange={(page) => setState({ page })}
              onLimitChange={(limit) => setState({ limit })}
            />
          </div>
        )}
      </Card>

      <DeletePatientDialog patient={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </>
  );
}

function PatientRowActions({ patient, onDelete }: { patient: PatientListItem; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${patient.fullName}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/patients/${patient._id}`}>
            <Eye aria-hidden /> View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/patients/${patient._id}/edit`}>
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
