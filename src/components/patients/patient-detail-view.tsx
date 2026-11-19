"use client";

import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  CakeSlice,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-context";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { ReassignPatientDialog } from "@/components/patients/reassign-patient-dialog";
import { ConditionBadge, SpecializationBadge } from "@/components/shared/badges";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENDER_LABELS } from "@/constants/domain";
import { isApiError } from "@/lib/api/client";
import { ageFromDateOfBirth, formatDateOfBirth, formatDateTime, formatRelative } from "@/lib/format";
import { usePatient } from "@/lib/queries/patients";

export function PatientDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: patient, isPending, isError, error, refetch } = usePatient(id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  useBreadcrumbLabel(id, patient?.fullName);

  if (isPending) return <DetailPageSkeleton />;

  if (isError) {
    const notFound = isApiError(error) && (error.status === 404 || error.status === 400);
    return (
      <Card>
        {notFound ? (
          <EmptyState
            title="Patient not found"
            description="This patient may have been deleted, or the link is incorrect."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/patients">
                  <ArrowLeft aria-hidden /> Back to patients
                </Link>
              </Button>
            }
          />
        ) : (
          <ErrorState title="Couldn’t load this patient" error={error} onRetry={() => void refetch()} />
        )}
      </Card>
    );
  }

  const age = ageFromDateOfBirth(patient.dateOfBirth);
  const { address, doctor } = patient;
  const addressLines = [address.street, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.country];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <PersonAvatar name={patient.fullName} className="size-14 text-base" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{patient.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ConditionBadge value={patient.condition} />
              <span>
                {age !== null ? `${age} years` : "Age unknown"} · {GENDER_LABELS[patient.gender]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patient._id}/edit`}>
              <Pencil aria-hidden /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden /> Delete
          </Button>
        </div>
      </div>

      {/* DOM order = mobile priority (personal → doctor → record); desktop puts the doctor in a side column. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <Card className="gap-4 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <InfoRow icon={<Mail className="size-4" aria-hidden />} label="Email">
                <a href={`mailto:${patient.email}`} className="break-all text-primary hover:underline">
                  {patient.email}
                </a>
              </InfoRow>
              <InfoRow icon={<Phone className="size-4" aria-hidden />} label="Phone">
                <a href={`tel:${patient.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {patient.phone}
                </a>
              </InfoRow>
              <InfoRow icon={<CakeSlice className="size-4" aria-hidden />} label="Date of birth">
                {formatDateOfBirth(patient.dateOfBirth)}
                {age !== null && <span className="font-normal text-muted-foreground"> · {age} years old</span>}
              </InfoRow>
              <InfoRow icon={<UserRound className="size-4" aria-hidden />} label="Gender">
                {GENDER_LABELS[patient.gender]}
              </InfoRow>
              <InfoRow icon={<MapPin className="size-4" aria-hidden />} label="Address" className="sm:col-span-2">
                <address className="not-italic">
                  {addressLines.filter(Boolean).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </InfoRow>
            </CardContent>
          </Card>

        {/* Assigned doctor */}
        <Card className="h-fit gap-4 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assigned doctor</CardTitle>
            {doctor && (
              <Button variant="ghost" size="sm" onClick={() => setReassignOpen(true)}>
                <ArrowRightLeft aria-hidden /> Reassign
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {doctor ? (
              <div className="space-y-4">
                <Link
                  href={`/doctors/${doctor._id}`}
                  className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <PersonAvatar name={doctor.name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium group-hover:text-primary">{doctor.name}</p>
                    <SpecializationBadge value={doctor.specialization} className="mt-1" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
                <div className="space-y-2.5 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{doctor.hospital}</span>
                  </p>
                  {doctor.email && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4 shrink-0" aria-hidden />
                      <a href={`mailto:${doctor.email}`} className="truncate hover:text-foreground hover:underline">
                        {doctor.email}
                      </a>
                    </p>
                  )}
                  {doctor.phone && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4 shrink-0" aria-hidden />
                      {doctor.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No doctor assigned.</p>
            )}
          </CardContent>
        </Card>

          <Card className="gap-4 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 sm:block">
                <p className="text-muted-foreground">Registered</p>
                <p className="font-medium">{formatDateTime(patient.createdAt)}</p>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium" title={formatDateTime(patient.updatedAt)}>
                  {formatRelative(patient.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
      </div>

      <DeletePatientDialog
        patient={deleteOpen ? patient : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/patients")}
      />
      {doctor && (
        <ReassignPatientDialog
          patient={reassignOpen ? patient : null}
          currentDoctor={doctor}
          onOpenChange={setReassignOpen}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, children, className }: { icon: ReactNode; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex gap-3 ${className ?? ""}`}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>
      <div className="min-w-0 text-sm">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}
