"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/constants/domain";
import { applyServerFieldErrors } from "@/lib/forms";
import { doctorFormSchema, type DoctorFormInput, type DoctorFormValues } from "@/lib/validations/doctor";
import type { Doctor } from "@/types/models";

const FIELDS = ["name", "specialization", "hospital", "phone", "email"] as const;

interface DoctorFormProps {
  doctor?: Doctor;
  submitLabel: string;
  onSubmit: (values: DoctorFormValues) => Promise<unknown>;
  onCancel: () => void;
  /** Called when the server rejects the request without field-level details. */
  onUnhandledError: (error: unknown) => void;
}

export function DoctorForm({ doctor, submitLabel, onSubmit, onCancel, onUnhandledError }: DoctorFormProps) {
  // Unique per instance: Next keeps visited routes mounted (hidden), so fixed ids would collide.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const form = useForm<DoctorFormInput, unknown, DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialization: doctor?.specialization,
      hospital: doctor?.hospital ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (!applyServerFieldErrors(error, form.setError, FIELDS)) onUnhandledError(error);
    }
  });

  const { isSubmitting, isDirty } = form.formState;

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("name")}>Full name</FieldLabel>
                <Input {...field} id={fid("name")} placeholder="Dr. Jane Smith" autoComplete="off" aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="specialization"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("specialization")}>Specialization</FieldLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id={fid("specialization")} className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
                    <SelectValue placeholder="Select a specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <Controller
          name="hospital"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("hospital")}>Hospital</FieldLabel>
              <Input {...field} id={fid("hospital")} placeholder="St. Mary Medical Center" aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("email")}>Email</FieldLabel>
                <Input
                  {...field}
                  id={fid("email")}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="jane.smith@hospital.org"
                  aria-invalid={fieldState.invalid}
                />
                {!fieldState.error && <FieldDescription>Must be unique across all doctors.</FieldDescription>}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("phone")}>Phone</FieldLabel>
                <Input
                  {...field}
                  id={fid("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="+1 (555) 123-4567"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="mt-8 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || (doctor !== undefined && !isDirty)}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
