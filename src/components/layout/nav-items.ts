import { LayoutDashboard, Stethoscope, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Doctors", href: "/doctors", icon: Stethoscope },
  { title: "Patients", href: "/patients", icon: Users },
];

export function isNavItemActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
