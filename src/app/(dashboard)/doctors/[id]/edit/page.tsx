import type { Metadata } from "next";
import { Suspense } from "react";
import { EditDoctorView } from "@/components/doctors/doctor-editor-views";
import { FormPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Edit doctor" };

export default function EditDoctorPage() {
  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <EditDoctorView />
    </Suspense>
  );
}
