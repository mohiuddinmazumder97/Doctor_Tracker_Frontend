import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientDetailView } from "@/components/patients/patient-detail-view";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Patient" };

export default function PatientPage() {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <PatientDetailView />
    </Suspense>
  );
}
