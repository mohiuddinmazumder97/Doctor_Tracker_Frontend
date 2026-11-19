"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorsApi, type DoctorListParams, type DoctorPatientsParams } from "@/lib/api/doctors";
import type { DoctorFormValues } from "@/lib/validations/doctor";
import { queryKeys } from "./keys";

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: ({ signal }) => doctorsApi.list(params, signal),
    // Keep showing the current page while the next one loads (no skeleton flash on paging).
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: ({ signal }) => doctorsApi.get(id, signal),
    enabled: options.enabled ?? true,
  });
}

export function useDoctorPatients(id: string, params: DoctorPatientsParams) {
  return useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: ({ signal }) => doctorsApi.patients(id, params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Lightweight search used by the doctor picker (patient forms, reassignment). */
export function useDoctorSearch(search: string, enabled = true) {
  const params: DoctorListParams = { page: 1, limit: 20, search: search || undefined, sortBy: "name", order: "asc" };
  return useQuery({
    queryKey: [...queryKeys.doctors.options, params],
    queryFn: ({ signal }) => doctorsApi.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    enabled,
  });
}

/** Doctors and patients feed the dashboard, so any change refreshes it too. */
function invalidateDoctorData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  ]);
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorsApi.create,
    onSuccess: (doctor) => {
      queryClient.setQueryData(queryKeys.doctors.detail(doctor._id), doctor);
      void invalidateDoctorData(queryClient);
    },
  });
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<DoctorFormValues>) => doctorsApi.update(id, values),
    onSuccess: (doctor) => {
      queryClient.setQueryData(queryKeys.doctors.detail(id), doctor);
      void invalidateDoctorData(queryClient);
      // Patient rows embed the doctor's name.
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorsApi.remove,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.doctors.detail(id) });
      void invalidateDoctorData(queryClient);
    },
  });
}
