import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </main>
  );
}
