import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-context";

/**
 * Shell for every authenticated page. proxy.ts has already redirected visitors
 * without a session cookie; the backend verifies the token on every API call.
 * Page content renders immediately (no "who am I" waterfall) — only the user
 * menu waits for /api/auth/me.
 */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <BreadcrumbProvider>
      <div className="min-h-svh">
        <AppSidebar />
        <div className="flex min-h-svh flex-col lg:pl-64">
          <AppTopbar />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
