/** Mirrors backend/src/constants/domain.ts — the API validates against the same lists. */
export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Practice",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Other",
] as const;

export const MEDICAL_CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
  "Migraine",
  "Depression",
  "Anxiety",
  "Allergies",
  "Thyroid Disorder",
  "COPD",
  "Cancer",
  "Pregnancy",
  "Other",
] as const;

export const GENDERS = ["male", "female", "other"] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export type Specialization = (typeof SPECIALIZATIONS)[number];
export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number];
export type Gender = (typeof GENDERS)[number];
