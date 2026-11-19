"use client";

import { ArrowRightLeft, Eye, MoreHorizontal, Plus, SearchX, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { PatientForm } from "@/components/patients/patient-form";
import { ReassignPatientDialog } from "@/components/patients/reassign-patient-dialog";
import { ConditionBadge } from "@/components/shared/badges";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { CardListSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GENDER_LABELS } from "@/constants/domain";
import { errorMessage } from "@/lib/forms";
import { ageFromDateOfBirth, formatDate, pluralize } from "@/lib/format";
import { useDoctorPatients } from "@/lib/queries/doctors";
import { useCreatePatient } from "@/lib/queries/patients";
import { cn } from "@/lib/utils";
import type { Doctor, DoctorSummary, PatientListItem } from "@/types/models";

const PAGE_SIZE = 8;

export function DoctorPatientsSection({ doctor }: { doctor: Doctor }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [toReassign, setToReassign] = useState<PatientListItem | null>(null);
  const [toDelete, setToDelete] = useState<PatientListItem | null>(null);

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useDoctorPatients(doctor._id, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    sortBy: "createdAt",
    order: "desc",
  });
  const createPatient = useCreatePatient();

  const summary: DoctorSummary = {
    _id: doctor._id,
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: doctor.hospital,
  };
  const items = data?.items ?? [];

  return (
    <Card id="patients" className="scroll-mt-24 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between [.border-b]:pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Patients</CardTitle>
          <CardDescription>
            {data ? pluralize(data.meta.total, "patient") : "Loading…"}
            {search ? ` matching “${search}”` : " under this doctor’s care"}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search patients…"
            aria-label="Search this doctor's patients"
            className="sm:w-56"
          />
          <Button onClick={() => setAddOpen(true)}>
            <Plus aria-hidden /> Add patient
          </Button>
        </div>
      </CardHeader>

      {isError ? (
        <ErrorState compact title="Couldn’t load patients" error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <CardListSkeleton rows={4} />
      ) : items.length === 0 ? (
        search ? (
          <EmptyState compact icon={SearchX} title="No matching patients" description="Try a different name, email or phone." />
        ) : (
          <EmptyState
            compact
            icon={UserPlus}
            title="No patients yet"
            description={`Add the first patient for ${doctor.name}.`}
            action={
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden /> Add patient
              </Button>
            }
          />
        )
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && isFetching && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4 text-xs tracking-wide uppercase">Patient</TableHead>
                <TableHead className="text-xs tracking-wide uppercase">Condition</TableHead>
                <TableHead className="hidden text-xs tracking-wide uppercase sm:table-cell">Age</TableHead>
                <TableHead className="hidden text-xs tracking-wide uppercase lg:table-cell">Added</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((patient) => {
                const age = ageFromDateOfBirth(patient.dateOfBirth);
                return (
                  <TableRow key={patient._id}>
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={patient.fullName} className="hidden sm:flex" />
                        <div className="min-w-0">
                          <Link href={`/patients/${patient._id}`} className="block max-w-[11rem] truncate font-medium hover:underline sm:max-w-none">
                            {patient.fullName}
                          </Link>
                          <p className="max-w-[11rem] truncate text-xs text-muted-foreground sm:max-w-none">{patient.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConditionBadge value={patient.condition} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {age ?? "—"} · {GENDER_LABELS[patient.gender]}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">{formatDate(patient.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${patient.fullName}`}>
                            <MoreHorizontal aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${patient._id}`}>
                              <Eye aria-hidden /> View patient
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setToReassign(patient)}>
                            <ArrowRightLeft aria-hidden /> Reassign to another doctor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(patient)}>
                            <Trash2 aria-hidden /> Delete patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="border-t px-3 py-3 sm:px-4">
          <PaginationBar meta={data.meta} itemLabel="patients" onPageChange={setPage} />
        </div>
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Add patient</SheetTitle>
            <SheetDescription>
              The patient will be assigned to <span className="font-medium text-foreground">{doctor.name}</span>.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            {/* Remount each time the sheet opens so the form starts empty. */}
            {addOpen && (
              <PatientForm
                defaultDoctor={summary}
                lockDoctor
                submitLabel="Add patient"
                onCancel={() => setAddOpen(false)}
                onUnhandledError={(error) => toast.error(errorMessage(error, "Could not add the patient"))}
                onSubmit={async (values) => {
                  const patient = await createPatient.mutateAsync(values);
                  toast.success(`${patient.fullName} was added to ${doctor.name}’s patients`);
                  setAddOpen(false);
                  setSearch("");
                  setPage(1);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ReassignPatientDialog patient={toReassign} currentDoctor={summary} onOpenChange={(open) => !open && setToReassign(null)} />
      <DeletePatientDialog patient={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </Card>
  );
}
