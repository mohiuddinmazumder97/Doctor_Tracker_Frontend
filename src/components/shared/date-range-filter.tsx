"use client";

import { format, startOfMonth, startOfYear, subDays } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay, parseDay } from "@/lib/date-range";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  label?: string;
  className?: string;
}

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  { label: "Last 7 days", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last 90 days", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: "This year", range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

function describe(from?: Date, to?: Date) {
  if (from && to) {
    const sameYear = from.getFullYear() === to.getFullYear();
    return `${format(from, sameYear ? "MMM d" : "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  }
  if (from) return `From ${format(from, "MMM d, yyyy")}`;
  if (to) return `Until ${format(to, "MMM d, yyyy")}`;
  return null;
}

export function DateRangeFilter({ from, to, onChange, label = "Created date", className }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = from || to ? { from: parseDay(from), to: parseDay(to) } : undefined;
  const summary = describe(selected?.from, selected?.to);

  const apply = (range: DateRange | undefined) => {
    onChange({ from: formatDay(range?.from), to: formatDay(range?.to ?? range?.from) });
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 w-full justify-start bg-card font-normal sm:w-auto",
              summary && "rounded-r-none border-r-0",
              !summary && "text-muted-foreground",
            )}
          >
            <CalendarDays className="text-muted-foreground" aria-hidden />
            <span className="truncate">{summary ?? label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => {
                    apply(preset.range());
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={selected}
              defaultMonth={selected?.from}
              disabled={{ after: new Date() }}
              onSelect={(range) => {
                apply(range);
                if (range?.from && range.to && range.from.getTime() !== range.to.getTime()) setOpen(false);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
      {summary && (
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-l-none bg-card text-muted-foreground"
          onClick={() => onChange({ from: undefined, to: undefined })}
          aria-label="Clear date filter"
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  );
}
