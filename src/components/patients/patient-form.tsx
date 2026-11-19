"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENDER_LABELS, GENDERS, MEDICAL_CONDITIONS } from "@/constants/domain";
import { applyServerFieldErrors } from "@/lib/forms";
import { patientFormSchema, type PatientFormInput, type PatientFormValues } from "@/lib/validations/patient";
import type { DoctorSummary, Patient } from "@/types/models";
import { DoctorSelect } from "./doctor-select";

const FIELDS = ["fullName", "email", "phone", "dateOfBirth", "gender", "condition", "doctor", "address"] as const;

interface PatientFormProps {
  patient?: Patient;
  /** Pre-assigns a doctor (e.g. adding a patient from a doctor's page). */
  defaultDoctor?: DoctorSummary;
  /** Hide the doctor picker when the doctor is fixed by context. */
  lockDoctor?: boolean;
  submitLabel: string;
  onSubmit: (values: PatientFormValues) => Promise<unknown>;
  onCancel: () => void;
  onUnhandledError: (error: unknown) => void;
}

function TextField({
  name,
  label,
  control,
  placeholder,
  type = "text",
  inputMode,
  autoComplete = "off",
  optional,
  idPrefix,
}: {
  idPrefix: string;
  name: "fullName" | "email" | "phone" | "address.street" | "address.city" | "address.state" | "address.postalCode" | "address.country";
  label: string;
  control: ReturnType<typeof useForm<PatientFormInput, unknown, PatientFormValues>>["control"];
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  optional?: boolean;
}) {
  const id = `${idPrefix}-${name.replace(".", "-")}`;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>
            {label}
            {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
          </FieldLabel>
          <Input
            {...field}
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function PatientForm({
  patient,
  defaultDoctor,
  lockDoctor = false,
  submitLabel,
  onSubmit,
  onCancel,
  onUnhandledError,
}: PatientFormProps) {
  // Unique per instance: Next keeps visited routes mounted (hidden), so fixed ids would collide.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const form = useForm<PatientFormInput, unknown, PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: patient?.fullName ?? "",
      email: patient?.email ?? "",
      phone: patient?.phone ?? "",
      dateOfBirth: patient?.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
      gender: patient?.gender,
      condition: patient?.condition,
      doctor: patient?.doctor?._id ?? defaultDoctor?._id ?? "",
      address: {
        street: patient?.address.street ?? "",
        city: patient?.address.city ?? "",
        state: patient?.address.state ?? "",
        postalCode: patient?.address.postalCode ?? "",
        country: patient?.address.country ?? "",
      },
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
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <FieldSet>
        <FieldLegend>Personal details</FieldLegend>
        <FieldGroup className="gap-5">
          <TextField idPrefix={uid} name="fullName" label="Full name" control={form.control} placeholder="Jane Doe" />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField idPrefix={uid} name="email" label="Email" type="email" inputMode="email" control={form.control} placeholder="jane@example.com" />
            <TextField idPrefix={uid} name="phone" label="Phone" type="tel" inputMode="tel" control={form.control} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="dateOfBirth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("dateOfBirth")}>Date of birth</FieldLabel>
                  <Input {...field} id={fid("dateOfBirth")} type="date" min="1900-01-01" max={today} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id={fid("gender")}>Gender</FieldLabel>
                  <RadioGroup
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    aria-labelledby={fid("gender")}
                    aria-invalid={fieldState.invalid}
                    className="flex min-h-9 flex-wrap items-center gap-x-5 gap-y-2"
                  >
                    {GENDERS.map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2 text-sm">
                        <RadioGroupItem value={g} aria-invalid={fieldState.invalid} />
                        {GENDER_LABELS[g]}
                      </label>
                    ))}
                  </RadioGroup>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Care</FieldLegend>
        <FieldGroup className="gap-5">
          <div className={lockDoctor ? undefined : "grid gap-5 sm:grid-cols-2"}>
            <Controller
              name="condition"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("condition")}>Medical condition</FieldLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id={fid("condition")} className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
                      <SelectValue placeholder="Select a condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICAL_CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {!lockDoctor && (
              <Controller
                name="doctor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fid("doctor")}>Assigned doctor</FieldLabel>
                    <DoctorSelect
                      id={fid("doctor")}
                      value={field.value}
                      onChange={(doctor) => field.onChange(doctor._id)}
                      onBlur={field.onBlur}
                      selectedDoctor={patient?.doctor ?? defaultDoctor ?? null}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Address</FieldLegend>
        <FieldGroup className="gap-5">
          <TextField idPrefix={uid} name="address.street" label="Street address" control={form.control} placeholder="123 Maple Ave" />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField idPrefix={uid} name="address.city" label="City" control={form.control} placeholder="Boston" />
            <TextField idPrefix={uid} name="address.state" label="State / region" control={form.control} placeholder="MA" optional />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField idPrefix={uid} name="address.postalCode" label="Postal code" control={form.control} placeholder="02108" optional />
            <TextField idPrefix={uid} name="address.country" label="Country" control={form.control} placeholder="United States" />
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || (patient !== undefined && !isDirty)}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
