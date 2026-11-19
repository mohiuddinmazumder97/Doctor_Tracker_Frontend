import { z } from "zod";
import { GENDERS, MEDICAL_CONDITIONS } from "@/constants/domain";
import { emailField, phoneField } from "./doctor";

const requiredText = (label: string, max: number) =>
  z.string().trim().min(2, `${label} is required`).max(max, `${label} is too long`);

export const patientFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Name is too long"),
  email: emailField,
  phone: phoneField,
  /** yyyy-MM-dd from <input type="date"> */
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
    .refine((v) => new Date(v) <= new Date(), "Date of birth cannot be in the future")
    .refine((v) => new Date(v).getUTCFullYear() >= 1900, "Date of birth must be after 1900"),
  gender: z.enum(GENDERS, { error: "Select a gender" }),
  condition: z.enum(MEDICAL_CONDITIONS, { error: "Select a medical condition" }),
  doctor: z.string().min(1, "Assign a doctor"),
  address: z.object({
    street: requiredText("Street", 200),
    city: requiredText("City", 100),
    state: z.string().trim().max(100, "State is too long"),
    postalCode: z.string().trim().max(20, "Postal code is too long"),
    country: requiredText("Country", 100),
  }),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
export type PatientFormInput = z.input<typeof patientFormSchema>;
