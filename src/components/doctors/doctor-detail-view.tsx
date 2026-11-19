"use client";

import { ArrowLeft, Building2, CalendarDays, Mail, Pencil, Phone, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DeleteDoctorDialog } from "@/components/doctors/delete-doctor-dialog";
import { DoctorPatientsSection } from "@/components/doctors/doctor-patients-section";
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-context";
import { SpecializationBadge } from "@/components/shared/badges";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isApiError } from "@/lib/api/client";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { useDoctor } from "@/lib/queries/doctors";

export function DoctorDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: doctor, isPending, isError, error, refetch } = useDoctor(id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useBreadcrumbLabel(id, doctor?.name);

  if (isPending) return <DetailPageSkeleton />;

  if (isError) {
    const notFound = isApiError(error) && (error.status === 404 || error.status === 400);
    return (
      <Card>
        {notFound ? (
          <EmptyState
            title="Doctor not found"
            description="This doctor may have been deleted, or the link is incorrect."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/doctors">
                  <ArrowLeft aria-hidden /> Back to doctors
                </Link>
              </Button>
            }
          />
        ) : (
          <ErrorState title="Couldn’t load this doctor" error={error} onRetry={() => void refetch()} />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <PersonAvatar name={doctor.name} className="size-14 text-base" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{doctor.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <SpecializationBadge value={doctor.specialization} />
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" aria-hidden />
                {doctor.hospital}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" asChild>
            <Link href={`/doctors/${doctor._id}/edit`}>
              <Pencil aria-hidden /> Edit
            </Link>
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Patients" value={doctor.patientCount} icon={<Users className="size-4" aria-hidden />} />
            <StatCard
              label="On staff since"
              value={formatDate(doctor.createdAt)}
              small
              icon={<CalendarDays className="size-4" aria-hidden />}
            />
          </div>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={<Mail className="size-4" aria-hidden />} label="Email">
                <a href={`mailto:${doctor.email}`} className="break-all text-primary hover:underline">
                  {doctor.email}
                </a>
              </InfoRow>
              <InfoRow icon={<Phone className="size-4" aria-hidden />} label="Phone">
                <a href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {doctor.phone}
                </a>
              </InfoRow>
              <InfoRow icon={<Building2 className="size-4" aria-hidden />} label="Hospital">
                {doctor.hospital}
              </InfoRow>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span className="text-right" title={formatDateTime(doctor.createdAt)}>
                  {formatDateTime(doctor.createdAt)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>
                <span className="text-right" title={formatDateTime(doctor.updatedAt)}>
                  {formatRelative(doctor.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients */}
        <div className="min-w-0 lg:col-span-2">
          <DoctorPatientsSection doctor={doctor} />
        </div>
      </div>

      <DeleteDoctorDialog
        doctor={deleteOpen ? doctor : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/doctors")}
      />
    </div>
  );
}

function StatCard({ label, value, icon, small }: { label: string; value: ReactNode; icon: ReactNode; small?: boolean }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <p className={small ? "text-sm font-semibold" : "text-2xl font-semibold tabular-nums"}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>
      <div className="min-w-0 text-sm">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}
