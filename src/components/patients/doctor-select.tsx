"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDoctorSearch } from "@/lib/queries/doctors";
import { cn } from "@/lib/utils";
import type { DoctorSummary } from "@/types/models";

interface DoctorSelectProps {
  value: string;
  onChange: (doctor: DoctorSummary) => void;
  /** Shown before the search results load (e.g. the patient's current doctor). */
  selectedDoctor?: DoctorSummary | null;
  excludeId?: string;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}

/** Searchable doctor picker. Searches server-side, so it scales past a few dozen doctors. */
export function DoctorSelect({ value, onChange, selectedDoctor, excludeId, id, invalid, disabled, onBlur }: DoctorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const { data, isFetching, isError } = useDoctorSearch(debouncedSearch, open);
  const [picked, setPicked] = useState<DoctorSummary | null>(null);

  const doctors = (data?.items ?? []).filter((d) => d._id !== excludeId);
  const current =
    (picked?._id === value ? picked : null) ??
    (selectedDoctor?._id === value ? selectedDoctor : null) ??
    doctors.find((d) => d._id === value) ??
    null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn("h-9 w-full justify-between bg-card px-3 font-normal", !current && "text-muted-foreground")}
        >
          {current ? (
            <span className="flex min-w-0 items-center gap-2">
              <PersonAvatar name={current.name} className="size-5 text-[9px]" />
              <span className="truncate">{current.name}</span>
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">· {current.specialization}</span>
            </span>
          ) : (
            "Select a doctor"
          )}
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        {/* shouldFilter=false: results are already filtered by the API. */}
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search doctors…" value={search} onValueChange={setSearch} />
          <CommandList>
            {isFetching && doctors.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
              </div>
            ) : (
              <CommandEmpty>{isError ? "Could not load doctors." : "No doctors found."}</CommandEmpty>
            )}
            {doctors.length > 0 && (
              <CommandGroup heading={search ? "Results" : "Doctors"}>
                {doctors.map((doctor) => (
                  <CommandItem
                    key={doctor._id}
                    value={doctor._id}
                    onSelect={() => {
                      const summary: DoctorSummary = {
                        _id: doctor._id,
                        name: doctor.name,
                        specialization: doctor.specialization,
                        hospital: doctor.hospital,
                      };
                      setPicked(summary);
                      onChange(summary);
                      setOpen(false);
                    }}
                    className="gap-2.5"
                  >
                    <PersonAvatar name={doctor.name} className="size-7" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{doctor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doctor.specialization} · {doctor.hospital}
                      </p>
                    </div>
                    <Check className={cn("size-4", value === doctor._id ? "opacity-100" : "opacity-0")} aria-hidden />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
