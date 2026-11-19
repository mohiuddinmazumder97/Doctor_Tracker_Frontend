import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <MobileNav />
      <div className="min-w-0 flex-1">
        {/* usePathname is runtime data on dynamic routes → stream it in. */}
        <Suspense fallback={<Skeleton className="h-4 w-40" />}>
          <AppBreadcrumbs />
        </Suspense>
      </div>
      <UserMenu />
    </header>
  );
}
