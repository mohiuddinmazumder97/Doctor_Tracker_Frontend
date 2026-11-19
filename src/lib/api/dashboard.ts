import type { Gender, MedicalCondition, Specialization } from "@/constants/domain";
import { api } from "./client";

export type TrendInterval = "day" | "week" | "month";

export interface DashboardOverview {
  totals: { doctors: number; patients: number };
  thisMonth: { doctors: number; patients: number };
  lastMonth: { doctors: number; patients: number };
  averagePatientsPerDoctor: number;
  recentDoctors: Array<{ _id: string; name: string; specialization: Specialization; hospital: string; createdAt: string }>;
  recentPatients: Array<{
    _id: string;
    fullName: string;
    condition: MedicalCondition;
    gender: Gender;
    doctor: { _id: string; name: string; specialization: Specialization } | null;
    createdAt: string;
  }>;
}

export interface PatientTrends {
  interval: TrendInterval;
  from: string;
  to: string;
  total: number;
  /** bucket = local calendar date (yyyy-MM-dd) of the bucket start, zero-filled. */
  points: Array<{ bucket: string; count: number }>;
}

export interface DoctorDistribution {
  items: Array<{ doctorId: string; name: string; specialization: Specialization; patientCount: number }>;
  totalPatients: number;
  doctorsWithPatients: number;
  otherPatients: number;
}

export interface ConditionDistribution {
  items: Array<{ condition: MedicalCondition; count: number }>;
  total: number;
}

export interface SpecializationDistribution {
  items: Array<{ specialization: Specialization; doctorCount: number; patientCount: number }>;
  totalDoctors: number;
}

export interface RangeParams {
  from?: string;
  to?: string;
  tz: string;
}

export const dashboardApi = {
  overview: (tz: string, signal?: AbortSignal) => api.get<DashboardOverview>("/dashboard/overview", { tz }, signal),
  trends: (params: RangeParams & { interval: TrendInterval }, signal?: AbortSignal) =>
    api.get<PatientTrends>("/dashboard/patient-trends", { ...params }, signal),
  doctorDistribution: (params: RangeParams & { limit: number }, signal?: AbortSignal) =>
    api.get<DoctorDistribution>("/dashboard/doctor-distribution", { ...params }, signal),
  conditionDistribution: (params: RangeParams, signal?: AbortSignal) =>
    api.get<ConditionDistribution>("/dashboard/condition-distribution", { ...params }, signal),
  specializationDistribution: (params: RangeParams, signal?: AbortSignal) =>
    api.get<SpecializationDistribution>("/dashboard/specialization-distribution", { ...params }, signal),
};
