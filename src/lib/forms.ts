import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api/client";

/**
 * Maps API validation/conflict errors (e.g. 409 duplicate email) onto form fields.
 * Returns true when at least one field error was applied, so the caller can skip a generic toast.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): boolean {
  if (!isApiError(error)) return false;
  let applied = false;
  for (const { path, message } of error.fieldErrors) {
    if (knownFields.includes(path) || knownFields.includes(path.split(".")[0] ?? "")) {
      setError(path as Path<T>, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
