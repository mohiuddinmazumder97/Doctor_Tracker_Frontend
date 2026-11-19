/** Shapes of the backend's response envelope. */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export interface ApiFailure {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export type SortOrder = "asc" | "desc";
