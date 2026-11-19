import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Doctors" };

// Doctor list, filters and CRUD are implemented in Phase 5.
export default function DoctorsPage() {
  return <PageHeader title="Doctors" description="Manage your medical staff and their patients." />;
}
