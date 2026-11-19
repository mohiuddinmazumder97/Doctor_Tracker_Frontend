import type { ApiErrorCode, ApiFailure, ApiFieldError, ApiSuccess, PaginationMeta } from "@/types/api";

/** All requests go to the same origin; next.config.ts rewrites /api/* to the backend. */
const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level errors from a 400/409 response, keyed by field path. */
  get fieldErrors(): ApiFieldError[] {
    if (!Array.isArray(this.details)) return [];
    return this.details.filter(
      (d): d is ApiFieldError =>
        typeof d === "object" && d !== null && typeof d.path === "string" && typeof d.message === "string",
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: QueryParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: PaginationMeta }> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the server. Check your connection and try again.");
  }

  if (response.status === 204) return { data: undefined as T };

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.success === false) {
    const error = payload && payload.success === false ? payload.error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? (response.status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
      error?.message ?? "Something went wrong. Please try again.",
      error?.details,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { query, signal }).then((r) => r.data),

  /** For list endpoints that return pagination metadata. */
  list: async <T>(path: string, query?: QueryParams, signal?: AbortSignal) => {
    const { data, meta } = await request<T[]>(path, { query, signal });
    if (!meta) throw new ApiError(500, "INTERNAL_ERROR", "Missing pagination metadata");
    return { items: data, meta };
  },

  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }).then((r) => r.data),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }).then((r) => r.data),
  delete: (path: string) => request<void>(path, { method: "DELETE" }).then(() => undefined),
};
