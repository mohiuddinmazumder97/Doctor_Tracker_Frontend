import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Dashboard" };

// Analytics widgets are implemented in Phase 7.
export default function DashboardPage() {
  return <PageHeader title="Dashboard" description="Overview of your doctors, patients and registrations." />;
}
