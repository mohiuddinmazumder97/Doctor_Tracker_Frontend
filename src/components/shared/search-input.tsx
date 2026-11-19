"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  /** The committed value (e.g. from the URL). */
  value: string;
  /** Called with the debounced value — not on every keystroke. */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
  "aria-label"?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search…", className, delay = 350, ...props }: SearchInputProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, delay);
  const lastCommitted = useRef(value);

  // Commit the debounced text once typing pauses.
  useEffect(() => {
    if (debounced.trim() === lastCommitted.current) return;
    lastCommitted.current = debounced.trim();
    onChange(debounced.trim());
  }, [debounced, onChange]);

  // Sync when the value changes from outside (e.g. "Clear filters", back button).
  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value;
      setText(value);
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && text) {
            event.preventDefault();
            setText("");
          }
        }}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? placeholder}
        maxLength={100}
        className="h-9 bg-card pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
