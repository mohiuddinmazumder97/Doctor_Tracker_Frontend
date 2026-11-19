"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/client";
import { safeRedirectPath } from "@/lib/navigation";
import { useLogin } from "@/lib/queries/auth";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginFormSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const sessionExpired = searchParams.get("reason") === "expired";
  const signedOut = searchParams.get("signedOut") === "1";
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const uid = useId();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        router.replace(safeRedirectPath(next));
        router.refresh();
      },
      onError: (error) => {
        // Surface server-side field validation errors on the matching inputs.
        if (isApiError(error)) {
          for (const { path, message } of error.fieldErrors) {
            if (path === "email" || path === "password") form.setError(path, { message });
          }
        }
        form.resetField("password", { keepError: true });
        form.setFocus("password");
      },
    });
  });

  const serverError =
    login.error && (!isApiError(login.error) || login.error.fieldErrors.length === 0)
      ? login.error.message
      : sessionExpired && !login.isPending && !login.isSuccess
        ? "Your session has ended. Please sign in again."
        : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {signedOut && !serverError && !login.isSuccess && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-accent px-3.5 py-3 text-sm text-accent-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>You have been signed out.</span>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{serverError}</span>
        </div>
      )}

      <FieldGroup className="gap-5">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${uid}-email`}>Email address</FieldLabel>
              <Input
                {...field}
                id={`${uid}-email`}
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="admin@hospital.org"
                aria-invalid={fieldState.invalid}
                className="h-10"
                autoFocus
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${uid}-password`}>Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={`${uid}-password`}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={fieldState.invalid}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={login.isPending || login.isSuccess}>
        {(login.isPending || login.isSuccess) && <Loader2 className="animate-spin" aria-hidden />}
        {login.isSuccess ? "Redirecting…" : login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
