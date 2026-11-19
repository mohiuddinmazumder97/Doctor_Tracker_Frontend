"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardApi, type RangeParams, type TrendInterval } from "@/lib/api/dashboard";
import { queryKeys } from "./keys";

/**
 * Dashboard queries share the ["dashboard"] key prefix, so every doctor/patient
 * mutation invalidates all of them at once and the charts reflect changes immediately.
 * keepPreviousData holds the previous render while a new period loads (no skeleton flash).
 */
export function useDashboardOverview(tz: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.section("overview", { tz }),
    queryFn: ({ signal }) => dashboardApi.overview(tz, signal),
  });
}

export function usePatientTrends(params: RangeParams & { interval: TrendInterval }) {
  return useQuery({
    queryKey: queryKeys.dashboard.section("trends", params),
    queryFn: ({ signal }) => dashboardApi.trends(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDoctorDistribution(params: RangeParams & { limit: number }) {
  return useQuery({
    queryKey: queryKeys.dashboard.section("doctor-distribution", params),
    queryFn: ({ signal }) => dashboardApi.doctorDistribution(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useConditionDistribution(params: RangeParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.section("condition-distribution", params),
    queryFn: ({ signal }) => dashboardApi.conditionDistribution(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSpecializationDistribution(params: RangeParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.section("specialization-distribution", params),
    queryFn: ({ signal }) => dashboardApi.specializationDistribution(params, signal),
    placeholderData: keepPreviousData,
  });
}
