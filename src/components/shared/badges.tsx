import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SpecializationBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-primary/20 bg-accent/60 font-medium text-accent-foreground", className)}>
      {value}
    </Badge>
  );
}

export function ConditionBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", className)}>
      {value}
    </Badge>
  );
}
