import type { Gender, MedicalCondition, Specialization } from "@/constants/domain";

/** Dates arrive as ISO strings over JSON. */
type ISODate = string;

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** The subset of a doctor embedded in patient responses. */
export interface DoctorSummary {
  _id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
  email?: string;
  phone?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Row in patient lists (the API omits the address there). */
export interface PatientListItem {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: ISODate;
  gender: Gender;
  condition: MedicalCondition;
  /** null only if the doctor was removed out-of-band; the API prevents this. */
  doctor: DoctorSummary | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Patient extends PatientListItem {
  address: Address;
}
