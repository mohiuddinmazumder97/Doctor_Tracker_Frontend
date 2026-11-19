"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
