import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "./sidebar-nav";

/** Persistent desktop sidebar (lg and up). Mobile uses the sheet in the top bar. */
export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="Doctor Tracker home" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </div>
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/60 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">Administrator portal</p>
          <p className="text-xs text-muted-foreground">Data is scoped to your organization.</p>
        </div>
      </div>
    </aside>
  );
}
