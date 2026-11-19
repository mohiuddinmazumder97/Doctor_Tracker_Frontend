"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-context";
import { PatientForm } from "@/components/patients/patient-form";
import { FormPageSkeleton } from "@/components/shared/page-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/forms";
import { useDoctor } from "@/lib/queries/doctors";
import { useCreatePatient, usePatient, useUpdatePatient } from "@/lib/queries/patients";

const onUnhandledError = (error: unknown) => toast.error(errorMessage(error, "Could not save the patient"));
const OBJECT_ID = /^[a-f\d]{24}$/i;

export function CreatePatientView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createPatient = useCreatePatient();

  // Optional pre-assignment: /patients/new?doctorId=… (from a filtered list or a doctor page).
  const doctorParam = searchParams.get("doctorId");
  const doctorId = doctorParam && OBJECT_ID.test(doctorParam) ? doctorParam : "";
  const doctor = useDoctor(doctorId, { enabled: Boolean(doctorId) });

  if (doctorId && doctor.isLoading) return <FormPageSkeleton />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add patient"
        description={doctor.data ? `Register a new patient under ${doctor.data.name}.` : "Register a new patient and assign them to a doctor."}
      />
      <Card>
        <CardContent>
          <PatientForm
            defaultDoctor={doctor.data}
            submitLabel="Create patient"
            onCancel={() => router.back()}
            onUnhandledError={onUnhandledError}
            onSubmit={async (values) => {
              const patient = await createPatient.mutateAsync(values);
              toast.success(`${patient.fullName} was registered`);
              router.replace(`/patients/${patient._id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function EditPatientView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: patient, isPending, isError, error, refetch } = usePatient(id);
  const updatePatient = useUpdatePatient();
  useBreadcrumbLabel(id, patient?.fullName);

  if (isPending) return <FormPageSkeleton />;
  if (isError) {
    const notFound = isApiError(error) && (error.status === 404 || error.status === 400);
    return (
      <Card className="mx-auto max-w-3xl">
        {notFound ? (
          <EmptyState
            title="Patient not found"
            description="This patient may have been deleted."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/patients">
                  <ArrowLeft aria-hidden /> Back to patients
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
      <PageHeader title={`Edit ${patient.fullName}`} description="Update the patient’s details, condition or assigned doctor." />
      <Card>
        <CardContent>
          <PatientForm
            patient={patient}
            submitLabel="Save changes"
            onCancel={() => router.back()}
            onUnhandledError={onUnhandledError}
            onSubmit={async (values) => {
              await updatePatient.mutateAsync({ id, values });
              toast.success("Patient updated");
              router.replace(`/patients/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
