/**
 * Query-key factory. Hierarchical keys make invalidation precise:
 * invalidating ["doctors"] refreshes every doctor list and detail at once,
 * while ["doctors", "detail", id] targets one record.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    lists: () => [...queryKeys.doctors.all, "list"] as const,
    list: (params: object) => [...queryKeys.doctors.lists(), params] as const,
    detail: (id: string) => [...queryKeys.doctors.all, "detail", id] as const,
    patients: (id: string, params: object) => [...queryKeys.doctors.all, "detail", id, "patients", params] as const,
    options: ["doctors", "options"] as const,
  },
  patients: {
    all: ["patients"] as const,
    lists: () => [...queryKeys.patients.all, "list"] as const,
    list: (params: object) => [...queryKeys.patients.lists(), params] as const,
    detail: (id: string) => [...queryKeys.patients.all, "detail", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    section: (name: string, params: object) => [...queryKeys.dashboard.all, name, params] as const,
  },
};
