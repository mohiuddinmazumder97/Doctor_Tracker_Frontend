"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DoctorForm } from "@/components/doctors/doctor-form";
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-context";
import { FormPageSkeleton } from "@/components/shared/page-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/forms";
import { useCreateDoctor, useDoctor, useUpdateDoctor } from "@/lib/queries/doctors";

const onUnhandledError = (error: unknown) => toast.error(errorMessage(error, "Could not save the doctor"));

export function CreateDoctorView() {
  const router = useRouter();
  const createDoctor = useCreateDoctor();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add doctor" description="Create a profile for a new member of your medical staff." />
      <Card>
        <CardContent>
          <DoctorForm
            submitLabel="Create doctor"
            onCancel={() => router.back()}
            onUnhandledError={onUnhandledError}
            onSubmit={async (values) => {
              const doctor = await createDoctor.mutateAsync(values);
              toast.success(`${doctor.name} was added`);
              router.replace(`/doctors/${doctor._id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function EditDoctorView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: doctor, isPending, isError, error, refetch } = useDoctor(id);
  const updateDoctor = useUpdateDoctor(id);
  useBreadcrumbLabel(id, doctor?.name);

  if (isPending) return <FormPageSkeleton />;
  if (isError) {
    const notFound = isApiError(error) && (error.status === 404 || error.status === 400);
    return (
      <Card className="mx-auto max-w-3xl">
        {notFound ? (
          <EmptyState
            title="Doctor not found"
            description="This doctor may have been deleted."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/doctors">
                  <ArrowLeft aria-hidden /> Back to doctors
                </Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={() => void refetch()} />
        )}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${doctor.name}`} description="Update this doctor’s profile and contact details." />
      <Card>
        <CardContent>
          <DoctorForm
            doctor={doctor}
            submitLabel="Save changes"
            onCancel={() => router.back()}
            onUnhandledError={onUnhandledError}
            onSubmit={async (values) => {
              await updateDoctor.mutateAsync(values);
              toast.success("Doctor updated");
              router.replace(`/doctors/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
