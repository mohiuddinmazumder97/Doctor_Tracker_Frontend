"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { z } from "zod";

type ParamValue = string | number | null | undefined;

interface SetOptions {
  /** Defaults to resetting the page whenever anything other than `page` changes. */
  resetPage?: boolean;
  /**
   * "push" adds a history entry (Back undoes a filter/sort/page change);
   * "replace" is for high-frequency updates such as typing in search.
   */
  history?: "push" | "replace";
}

/**
 * List state (search, filters, sort, page) lives in the URL: it survives refreshes,
 * works with back/forward, and links can be shared. Values are parsed with a Zod
 * schema whose fields use `.catch()`, so hand-edited/invalid URLs fall back to defaults.
 *
 * Updates use the native History API, which Next.js syncs into useSearchParams
 * WITHOUT a server round trip (router.replace would refetch the RSC payload first,
 * delaying every filter change by a network request).
 */
export function useUrlState<S extends z.ZodType<Record<string, unknown>>>(schema: S) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const state = useMemo(() => schema.parse(Object.fromEntries(searchParams.entries())) as z.output<S>, [schema, searchParams]);

  const setState = useCallback(
    (updates: Record<string, ParamValue>, options: SetOptions = {}) => {
      // Read the live URL so rapid successive updates don't overwrite each other.
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (options.resetPage ?? !("page" in updates)) next.delete("page");
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (url === `${window.location.pathname}${window.location.search}`) return;
      if (options.history === "replace") window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname],
  );

  const reset = useCallback(() => window.history.pushState(null, "", pathname), [pathname]);

  return [state, setState, reset] as const;
}
