import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

// Static shell; the view reads ?period / ?interval and the browser time zone on the client.
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
