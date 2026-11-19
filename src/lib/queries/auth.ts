"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { queryKeys } from "./keys";

export function useCurrentAdmin() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (admin) => {
      // Seed the cache so the dashboard renders immediately without a /me round trip.
      queryClient.setQueryData(queryKeys.auth.me, admin);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // A full page load (rather than router.replace + queryClient.clear()) discards the whole
      // in-memory cache at once. Clearing while components are still mounted would make their
      // queries refetch, hit 401, and trigger the "session expired" flow instead.
      window.location.replace("/login?signedOut=1");
    },
    onError: () => toast.error("Could not sign out. Please try again."),
  });
}
