"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

export const PAGE_SIZES = [10, 20, 50] as const;

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1]! > 1 ? (["gap", page] as const) : [page]));
}

interface PaginationBarProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemLabel?: string;
  className?: string;
}

export function PaginationBar({ meta, onPageChange, onLimitChange, itemLabel = "results", className }: PaginationBarProps) {
  const { page, limit, total, totalPages } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className={cn("flex flex-col-reverse items-center justify-between gap-3 sm:flex-row", className)}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <p aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">
            {start}–{end}
          </span>{" "}
          of <span className="font-medium text-foreground tabular-nums">{total.toLocaleString()}</span> {itemLabel}
        </p>
        {onLimitChange && (
          <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger size="sm" className="w-[4.5rem] bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="bg-card"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "secondary" : "ghost"}
                size="sm"
                className={cn("min-w-8 tabular-nums", item === page && "pointer-events-none font-semibold")}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </Button>
            ),
          )}
        </div>
        <span className="px-2 text-sm text-muted-foreground tabular-nums sm:hidden">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="bg-card"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight aria-hidden />
        </Button>
      </nav>
    </div>
  );
}
