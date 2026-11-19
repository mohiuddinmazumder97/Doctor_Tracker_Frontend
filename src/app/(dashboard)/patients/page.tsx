import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientsListView } from "@/components/patients/patients-list-view";
import { ListPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Patients" };

// Static shell; the list reads URL state (search, filters, page) on the client.
export default function PatientsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PatientsListView />
    </Suspense>
  );
}
