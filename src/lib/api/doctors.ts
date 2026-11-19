import type { MedicalCondition, Specialization } from "@/constants/domain";
import type { DoctorFormValues } from "@/lib/validations/doctor";
import type { SortOrder } from "@/types/api";
import type { Doctor, PatientListItem } from "@/types/models";
import { api } from "./client";

export type DoctorSortField = "createdAt" | "name" | "specialization" | "hospital" | "patientCount";

export interface DoctorListParams {
  page: number;
  limit: number;
  search?: string;
  specialization?: Specialization;
  /** ISO timestamps (start/end of the selected local days). */
  from?: string;
  to?: string;
  sortBy: DoctorSortField;
  order: SortOrder;
}

export interface DoctorPatientsParams {
  page: number;
  limit: number;
  search?: string;
  condition?: MedicalCondition;
  sortBy?: "createdAt" | "fullName" | "dateOfBirth" | "condition";
  order?: SortOrder;
}

export const doctorsApi = {
  list: (params: DoctorListParams, signal?: AbortSignal) => api.list<Doctor>("/doctors", { ...params }, signal),
  get: (id: string, signal?: AbortSignal) => api.get<Doctor>(`/doctors/${id}`, undefined, signal),
  create: (values: DoctorFormValues) => api.post<Doctor>("/doctors", values),
  update: (id: string, values: Partial<DoctorFormValues>) => api.patch<Doctor>(`/doctors/${id}`, values),
  remove: (id: string) => api.delete(`/doctors/${id}`),
  patients: (id: string, params: DoctorPatientsParams, signal?: AbortSignal) =>
    api.list<PatientListItem>(`/doctors/${id}/patients`, { ...params }, signal),
};
