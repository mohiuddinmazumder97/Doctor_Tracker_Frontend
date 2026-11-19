import type { Metadata } from "next";
import { Suspense } from "react";
import { EditPatientView } from "@/components/patients/patient-editor-views";
import { FormPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Edit patient" };

export default function EditPatientPage() {
  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <EditPatientView />
    </Suspense>
  );
}
