"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Lets detail pages replace an id segment in the breadcrumb with a human label
 * (e.g. /doctors/6aff… → "Dr. Daniel Miller") once their data has loaded.
 */
interface BreadcrumbContextValue {
  labels: Record<string, string>;
  setLabel: (segment: string, label: string | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((segment: string, label: string | undefined) => {
    setLabels((current) => {
      if (current[segment] === label) return current;
      const next = { ...current };
      if (label === undefined) delete next[segment];
      else next[segment] = label;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbContext)?.labels ?? {};
}

/** Call from a detail page: useBreadcrumbLabel(id, doctor?.name). */
export function useBreadcrumbLabel(segment: string, label: string | undefined) {
  const setLabel = useContext(BreadcrumbContext)?.setLabel;
  useEffect(() => {
    if (!setLabel || !label) return;
    setLabel(segment, label);
    return () => setLabel(segment, undefined);
  }, [segment, label, setLabel]);
}
