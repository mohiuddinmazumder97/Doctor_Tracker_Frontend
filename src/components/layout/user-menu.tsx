"use client";

import { ChevronDown, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentAdmin, useLogout } from "@/lib/queries/auth";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const { data: admin, isPending } = useCurrentAdmin();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();

  if (isPending || !admin) {
    return (
      <div className="flex items-center gap-2.5" aria-label="Loading account">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="hidden h-4 w-24 sm:block" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2.5 px-1.5 sm:pr-2.5" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
              {initials(admin.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{admin.name}</span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{admin.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:hidden" aria-hidden />
            <Moon className="hidden dark:block" aria-hidden />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun aria-hidden /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon aria-hidden /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor aria-hidden /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logout.isPending}
          onSelect={(event) => {
            event.preventDefault();
            logout.mutate();
          }}
        >
          <LogOut aria-hidden />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
