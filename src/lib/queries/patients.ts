"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientsApi, type PatientListParams } from "@/lib/api/patients";
import type { PatientFormValues } from "@/lib/validations/patient";
import { queryKeys } from "./keys";

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: ({ signal }) => patientsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: ({ signal }) => patientsApi.get(id, signal),
  });
}

/**
 * Patient changes affect patient lists, doctors' patient counts/lists and every dashboard widget.
 * Hierarchical keys make this three precise invalidations.
 */
function invalidatePatientData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  ]);
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientsApi.create,
    onSuccess: (patient) => {
      queryClient.setQueryData(queryKeys.patients.detail(patient._id), patient);
      void invalidatePatientData(queryClient);
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PatientFormValues> }) => patientsApi.update(id, values),
    onSuccess: (patient) => {
      queryClient.setQueryData(queryKeys.patients.detail(patient._id), patient);
      void invalidatePatientData(queryClient);
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientsApi.remove,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.patients.detail(id) });
      void invalidatePatientData(queryClient);
    },
  });
}
