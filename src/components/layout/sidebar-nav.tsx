"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavProps {
  onNavigate?: () => void;
}

/**
 * The pathname is runtime data on dynamic routes (/doctors/[id]), so it is read inside a
 * Suspense boundary; the fallback is the same menu without the active highlight.
 */
export function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<SidebarNavLinks {...props} pathname={null} />}>
      <ActiveSidebarNav {...props} />
    </Suspense>
  );
}

function ActiveSidebarNav(props: SidebarNavProps) {
  return <SidebarNavLinks {...props} pathname={usePathname()} />;
}

function SidebarNavLinks({ onNavigate, pathname }: SidebarNavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">Menu</p>
      {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
        const active = pathname !== null && isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden
            />
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
