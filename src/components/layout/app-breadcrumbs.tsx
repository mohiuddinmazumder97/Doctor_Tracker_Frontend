"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbLabels } from "./breadcrumb-context";

const STATIC_LABELS: Record<string, string> = {
  doctors: "Doctors",
  patients: "Patients",
  new: "New",
  edit: "Edit",
};

const OBJECT_ID = /^[a-f\d]{24}$/i;

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const dynamicLabels = useBreadcrumbLabels();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [
    { href: "/", label: "Dashboard" },
    ...segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: dynamicLabels[segment] ?? STATIC_LABELS[segment] ?? (OBJECT_ID.test(segment) ? "Details" : segment),
    })),
  ];

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          // On small screens only the current page and its parent are shown.
          const hideOnMobile = index < crumbs.length - 2;
          return (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator className={hideOnMobile ? "hidden md:block" : undefined} />}
              <BreadcrumbItem className={hideOnMobile ? "hidden md:inline-flex" : "min-w-0"}>
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
