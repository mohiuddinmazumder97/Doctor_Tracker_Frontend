import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          inverted ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-primary text-primary-foreground",
        )}
      >
        <Stethoscope className="size-4.5" aria-hidden />
      </span>
      <span className={cn("text-[15px] font-semibold tracking-tight", inverted ? "text-white" : "text-foreground")}>
        Doctor Tracker
      </span>
    </div>
  );
}
