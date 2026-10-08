import { z } from "zod";

export const vendorApplicationSchema = z.object({
  storeLogo: z.string().trim().url().optional().nullable(),
  storeBanner: z.string().trim().url().optional().nullable(),
  storeName: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(100, "Store name cannot exceed 100 characters")
    .trim(),

  storeDescription: z
    .string()
    .min(10, "Store description must be at least 10 characters")
    .max(500, "Store description cannot exceed 500 characters")
    .trim(),

  storeCategory: z
    .string()
    .min(2, "Store category is required")
    .max(50, "Store category cannot exceed 50 characters")
    .trim(),

  businessRegistration: z
    .string()
    .min(3, "Business registration number is required")
    .max(50, "Business registration number is too long")
    .trim(),

  taxId: z
    .string()
    .min(3, "Tax ID is required")
    .max(50, "Tax ID is too long")
    .trim(),

  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters")
    .max(255, "Business address cannot exceed 255 characters")
    .trim(),

  businessPhone: z
    .string()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Invalid business phone number"
    ),

  bankName: z
    .string()
    .min(2, "Bank name is required")
    .max(100, "Bank name cannot exceed 100 characters")
    .trim(),

  bankAccountNumber: z
    .string()
    .regex(/^\d{10}$/, "Bank account number must be 10 digits"),

  bankAccountName: z
    .string()
    .min(3, "Account name is required")
    .max(100, "Account name cannot exceed 100 characters")
    .trim(),

  bankCode: z
    .string()
    .regex(/^\d{3}$/, "Bank code must be 3 digits"),
});

export const updateVendorProfileSchema = vendorApplicationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one vendor profile field to update");

export const rejectVendorSchema = z.object({
  reason: z.string().max(1000).trim().optional(),
});
