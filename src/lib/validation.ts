import { z } from "zod";
import { faqCategories, quoteServiceOptions } from "@/config/site";

// Shared by the quote form (browser) and /api/quote (server), so both apply
// the same rules (QR-05). Messages are written for customers (UI-08).

const quoteValues = quoteServiceOptions.map((o) => o.value) as [string, ...string[]];

export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  // Digits, spaces, dashes, brackets, dots, and a leading +1 are allowed.
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

export const quoteSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(100, "Your name can be at most 100 characters."),
  contactNumber: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, {
      message: "Please enter a 10-digit phone number, for example 204-555-0198.",
    }),
  email: z
    .string()
    .trim()
    .max(254, "Your email address can be at most 254 characters.")
    .pipe(z.email("Please enter a valid email address, for example name@example.com.")),
  serviceType: z.enum(quoteValues, { error: "Please choose the type of service you need." }),
  projectLocation: z
    .string()
    .trim()
    .min(5, "Please enter the project location (at least 5 characters).")
    .max(200, "The project location can be at most 200 characters."),
  projectDescription: z
    .string()
    .trim()
    .min(20, "Please describe your project in at least 20 characters.")
    .max(2000, "The description can be at most 2,000 characters."),
});

export type QuoteFields = z.infer<typeof quoteSchema>;

export const quotePhotoRules = {
  maxCount: 5,
  maxBytesEach: 10 * 1024 * 1024,
  maxTotalBytes: 4 * 1024 * 1024,
  maxDimension: 1600,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const adminPhotoRules = {
  maxBytesEach: 10 * 1024 * 1024,
  maxOutputBytes: 1024 * 1024,
  maxDimension: 2400,
  maxProjectPhotos: 20,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

// Admin forms (SRS 3.2.7.2, 3.2.8.2, 3.2.10.2).

export const serviceSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(60, "Use at most 60 characters."),
  short_description: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(200, "Use at most 200 characters."),
  full_description: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(1500, "Use at most 1,500 characters."),
  is_visible: z.boolean(),
});

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(100, "Use at most 100 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(2000, "Use at most 2,000 characters."),
  service_id: z.string().min(1, "Choose a service category."),
  general_area: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(100, "Use at most 100 characters."),
  // "YYYY-MM" from a month input, or empty.
  completion_month: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}$/.test(v), "Choose a month and year.")
    .refine((v) => {
      if (v === "") return true;
      const now = new Date();
      const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return v <= current;
    }, "The completion date cannot be in the future."),
  is_published: z.boolean(),
});

export const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(200, "Use at most 200 characters."),
  answer: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(2000, "Use at most 2,000 characters."),
  category: z.enum(faqCategories as unknown as [string, ...string[]], {
    error: "Choose a category.",
  }),
  is_visible: z.boolean(),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
