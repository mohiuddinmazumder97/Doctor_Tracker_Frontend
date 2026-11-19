import type { Metadata } from "next";
import { CreateDoctorView } from "@/components/doctors/doctor-editor-views";

export const metadata: Metadata = { title: "Add doctor" };

export default function NewDoctorPage() {
  return <CreateDoctorView />;
}
