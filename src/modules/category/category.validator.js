import { z } from "zod";

const categoryFields = {
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(5000).trim().optional().nullable(),
  icon: z.string().trim().url().max(2048).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
};

export const createCategorySchema = z.object({
  name: categoryFields.name,
  description: categoryFields.description,
  icon: categoryFields.icon,
  parentId: categoryFields.parentId,
});

export const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one category field to update");
