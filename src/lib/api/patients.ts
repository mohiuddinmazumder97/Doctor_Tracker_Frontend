import type { Gender, MedicalCondition } from "@/constants/domain";
import type { PatientFormValues } from "@/lib/validations/patient";
import type { SortOrder } from "@/types/api";
import type { Patient, PatientListItem } from "@/types/models";
import { api } from "./client";

export type PatientSortField = "createdAt" | "fullName" | "dateOfBirth" | "condition";

export interface PatientListParams {
  page: number;
  limit: number;
  search?: string;
  doctorId?: string;
  condition?: MedicalCondition;
  gender?: Gender;
  from?: string;
  to?: string;
  sortBy: PatientSortField;
  order: SortOrder;
}

export const patientsApi = {
  list: (params: PatientListParams, signal?: AbortSignal) =>
    api.list<PatientListItem>("/patients", { ...params }, signal),
  get: (id: string, signal?: AbortSignal) => api.get<Patient>(`/patients/${id}`, undefined, signal),
  create: (values: PatientFormValues) => api.post<Patient>("/patients", values),
  update: (id: string, values: Partial<PatientFormValues>) => api.patch<Patient>(`/patients/${id}`, values),
  remove: (id: string) => api.delete(`/patients/${id}`),
};
