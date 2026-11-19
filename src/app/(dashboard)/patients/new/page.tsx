import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatePatientView } from "@/components/patients/patient-editor-views";
import { FormPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Add patient" };

// Reads ?doctorId= for pre-assignment, so the view streams inside Suspense.
export default function NewPatientPage() {
  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <CreatePatientView />
    </Suspense>
  );
}
