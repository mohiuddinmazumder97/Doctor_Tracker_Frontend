import { Activity, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm, LoginFormSkeleton } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  { icon: Users, title: "Doctors & patients in one place", text: "Manage care teams and patient assignments." },
  { icon: Activity, title: "Live analytics", text: "Registration trends and caseload distribution." },
  { icon: ShieldCheck, title: "Secure by default", text: "HTTP-only sessions and server-side validation." },
];

/**
 * Fully static shell (prerendered). Only the form reads the query string (?next, ?reason),
 * inside a Suspense boundary, so the rest of the page is served instantly from the CDN.
 */
export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-white/10 blur-3xl"
        />
        <Logo inverted className="relative" />

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
              Clinical administration, without the clutter.
            </h1>
            <p className="text-base text-primary-foreground/75">
              Track your medical staff, their patients, and how your practice is growing.
            </p>
          </div>
          <ul className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-primary-foreground/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Doctor Tracker · Administrator portal
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <Logo className="lg:hidden" />
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to the administrator portal to continue.</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-7">
            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Access is restricted to authorized administrators.
          </p>
        </div>
      </section>
    </main>
  );
}
