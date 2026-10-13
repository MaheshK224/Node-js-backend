import { z } from 'zod';

import { paginationQuerySchema, sortQuerySchema } from '../../../../utils/pagination.js';

// ---------- Request schemas (used by the validate middleware AND for Swagger docs) ----------

export const categoryIdParamsSchema = z.object({
  id: z
    .uuid()
    .meta({ description: 'Category ID', example: '0b6f7c1e-4d2a-4f53-9a3e-2f1d6c8b9a10' }),
});

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).meta({ example: 'Electronics' }),
    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .meta({ example: 'Phones, laptops and accessories' }),
  })
  .meta({ id: 'CreateCategoryRequest' });

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })
  .meta({ id: 'UpdateCategoryRequest' });

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional().meta({ description: 'Search by name' }),
  sort: sortQuerySchema(['name', 'createdAt'], 'name'),
});

// ---------- Response schema (documentation only) ----------

export const categoryResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Category' });

// ---------- Types inferred from schemas (no duplicate interfaces to maintain) ----------

export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
