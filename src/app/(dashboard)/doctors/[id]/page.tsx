import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetailView } from "@/components/doctors/doctor-detail-view";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = { title: "Doctor" };

// Static app shell; the view reads the id with useParams and fetches on the client.
export default function DoctorPage() {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <DoctorDetailView />
    </Suspense>
  );
}
