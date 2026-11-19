"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-1.5 lg:hidden" aria-label="Open navigation menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
        <SheetHeader className="h-16 justify-center border-b px-5">
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>
        <div className="px-3 py-4">
          {/* Close the sheet once a destination is chosen. */}
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
