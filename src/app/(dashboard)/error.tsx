"use client";

import { ErrorState } from "@/components/shared/state-views";
import { Card } from "@/components/ui/card";

/** Route-level error boundary: an unexpected render error keeps the shell usable. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mt-2">
      <ErrorState
        title="This page failed to load"
        description={error.digest ? `Unexpected error (ref ${error.digest}).` : "An unexpected error occurred."}
        onRetry={reset}
      />
    </Card>
  );
}
