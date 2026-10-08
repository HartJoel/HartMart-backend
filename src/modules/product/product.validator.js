import { z } from "zod";

const jsonObject = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z.record(z.string(), z.unknown()));
const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});
const imagesSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z.array(imageSchema));

const editableProductFields = {
  name: z.string().min(2).max(255).trim(),
  description: z.string().min(1).max(20000).trim(),
  basePrice: z.coerce.number().positive(),
  discountPrice: z.coerce.number().nonnegative().nullable(),
  totalStock: z.coerce.number().int().min(0),
  availableStock: z.coerce.number().int().min(0),
  reservedStock: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  images: imagesSchema.optional(),
  weight: z.coerce.number().positive().nullable(),
  dimensions: z.string().max(100).trim().nullable(),
  attributes: jsonObject,
  categoryId: z.string().min(1),
  categorySlug: z.string().min(1).trim(),
  slug: z.string().min(1).max(255).trim(),
};

export const createProductSchema = z.object({
  name: editableProductFields.name,
  description: editableProductFields.description,
  categorySlug: editableProductFields.categorySlug,
  basePrice: editableProductFields.basePrice,
  // The current service converts discountPrice with Number(), so require a
  // numeric value (use 0 when there is no discount).
  discountPrice: z.coerce.number().nonnegative(),
  totalStock: editableProductFields.totalStock,
  reorderLevel: editableProductFields.reorderLevel,
  weight: editableProductFields.weight.optional(),
  dimensions: editableProductFields.dimensions.optional(),
  attributes: editableProductFields.attributes.optional(),
});

export const updateProductSchema = z
  .object(editableProductFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one product field to update");

export const updateProductStockSchema = z
  .object({
    totalStock: z.coerce.number().int().min(0),
    reservedStock: z.coerce.number().int().min(0),
  })
  .refine((data) => data.reservedStock <= data.totalStock, {
    message: "Reserved stock cannot exceed total stock",
    path: ["reservedStock"],
  });
