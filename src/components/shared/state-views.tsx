import { AlertTriangle, Inbox, RotateCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateViewProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

function StateView({ title, description, icon: Icon = Inbox, action, className, compact, tone }: StateViewProps & { tone: "neutral" | "error" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          compact ? "size-10" : "size-12",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateViewProps) {
  return <StateView {...props} tone="neutral" />;
}

interface ErrorStateProps extends Omit<StateViewProps, "title" | "action"> {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", error, description, onRetry, ...rest }: ErrorStateProps) {
  const message = description ?? (error instanceof Error ? error.message : "Please try again in a moment.");
  return (
    <div role="alert">
      <StateView
        {...rest}
        tone="error"
        icon={rest.icon ?? AlertTriangle}
        title={title}
        description={message}
        action={
          onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw aria-hidden /> Try again
            </Button>
          )
        }
      />
    </div>
  );
}
