import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Patients" };

// Patient list, filters and CRUD are implemented in Phase 6.
export default function PatientsPage() {
  return <PageHeader title="Patients" description="Search, filter and manage patient records." />;
}
