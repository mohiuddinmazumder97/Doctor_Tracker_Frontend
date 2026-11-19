import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorsListView } from "@/components/doctors/doctors-list-view";
import { ListPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Doctors" };

// Static shell; the list reads URL state (search, filters, page) on the client.
export default function DoctorsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <DoctorsListView />
    </Suspense>
  );
}
