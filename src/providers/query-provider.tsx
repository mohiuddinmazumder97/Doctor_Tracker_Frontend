"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isApiError } from "@/lib/api/client";

/** A 401 anywhere means the session ended (expired, logged out elsewhere): go to login. */
function handleUnauthorized(error: unknown) {
  if (!isApiError(error) || error.status !== 401) return;
  if (typeof window === "undefined" || window.location.pathname.startsWith("/login")) return;
  const next = window.location.pathname + window.location.search;
  // Deliberately a full page load (not router.push): it discards every piece of in-memory
  // state from the expired session, including this QueryClient's cache.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${encodeURIComponent(next)}&reason=expired`);
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Client errors (4xx) won't fix themselves — only retry network/server failures.
        retry: (failureCount, error) =>
          failureCount < 2 && !(isApiError(error) && error.status >= 400 && error.status < 500),
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session (useState keeps it stable across re-renders).
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
