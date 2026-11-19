"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types/api";

interface SortableHeaderProps<F extends string> {
  field: F;
  label: string;
  sortBy: F;
  order: SortOrder;
  onSort: (field: F, order: SortOrder) => void;
  /** Direction applied on first click (dates/counts usually start descending). */
  defaultOrder?: SortOrder;
  className?: string;
  align?: "left" | "right";
}

export function SortableHeader<F extends string>({
  field,
  label,
  sortBy,
  order,
  onSort,
  defaultOrder = "asc",
  className,
  align = "left",
}: SortableHeaderProps<F>) {
  const active = sortBy === field;
  const Icon = !active ? ChevronsUpDown : order === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field, active ? (order === "asc" ? "desc" : "asc") : defaultOrder)}
        className={cn(
          "-mx-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium tracking-wide uppercase transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
      </button>
    </TableHead>
  );
}
