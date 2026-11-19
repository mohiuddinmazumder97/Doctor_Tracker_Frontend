import type { Admin } from "@/types/models";
import type { LoginValues } from "@/lib/validations/auth";
import { api } from "./client";

export const authApi = {
  login: (values: LoginValues) => api.post<{ admin: Admin }>("/auth/login", values).then((d) => d.admin),
  logout: () => api.post<void>("/auth/logout"),
  me: (signal?: AbortSignal) => api.get<{ admin: Admin }>("/auth/me", undefined, signal).then((d) => d.admin),
};
