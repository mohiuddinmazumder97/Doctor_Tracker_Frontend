import { z } from "zod";
import { SPECIALIZATIONS } from "@/constants/domain";

/** Mirrors the backend rules so users get instant feedback; the API re-validates everything. */
export const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const phoneField = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .regex(PHONE_REGEX, "Enter a valid phone number (digits, spaces, +, -, parentheses)");

export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  specialization: z.enum(SPECIALIZATIONS, { error: "Select a specialization" }),
  hospital: z.string().trim().min(2, "Hospital must be at least 2 characters").max(150, "Hospital name is too long"),
  phone: phoneField,
  email: emailField,
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;
/** Before validation the specialization select can be empty. */
export type DoctorFormInput = z.input<typeof doctorFormSchema>;
