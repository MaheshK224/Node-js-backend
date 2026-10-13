import { z } from 'zod';

import { paginationQuerySchema, sortQuerySchema } from '../../../../utils/pagination.js';

// ---------- Request schemas ----------

export const productIdParamsSchema = z.object({
  id: z.uuid().meta({ description: 'Product ID', example: '6a1d2c3b-7e8f-4a9b-8c0d-1e2f3a4b5c6d' }),
});

const price = z
  .number()
  .positive()
  .max(9_999_999_999.99)
  .multipleOf(0.01, 'Price can have at most 2 decimal places')
  .meta({ example: 799.99 });

// Fields without defaults. Shared by create (adds defaults) and update (all optional).
// Defaults must NOT be on the update schema, otherwise a PATCH would silently reset them.
const productFields = z.object({
  name: z.string().trim().min(2).max(150).meta({ example: 'iPhone 16' }),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,50}$/, 'SKU must be 3-50 characters: letters, numbers and dashes')
    .meta({ description: 'Stock keeping unit (unique)', example: 'APL-IP16-128' }),
  description: z.string().trim().max(1000).optional().meta({ example: '128 GB, Black' }),
  price,
  stock: z.number().int().min(0).meta({ example: 25 }),
  isActive: z.boolean(),
  categoryId: z.uuid(),
});

export const createProductSchema = productFields
  .extend({
    stock: productFields.shape.stock.default(0),
    isActive: productFields.shape.isActive.default(true),
  })
  .meta({ id: 'CreateProductRequest' });

export const updateProductSchema = productFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  })
  .meta({ id: 'UpdateProductRequest' });

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

export const listProductsQuerySchema = paginationQuerySchema
  .extend({
    search: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional()
      .meta({ description: 'Search in name or SKU' }),
    categoryId: z.uuid().optional(),
    isActive: booleanQuery.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: sortQuerySchema(['name', 'price', 'stock', 'createdAt'], '-createdAt'),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });

// ---------- Response schema (documentation only) ----------

export const productResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    sku: z.string(),
    description: z.string().nullable(),
    price: z.string().meta({
      description: 'Decimal returned as a string to avoid floating point rounding',
      example: '799.99',
    }),
    stock: z.number().int(),
    isActive: z.boolean(),
    categoryId: z.uuid(),
    category: z.object({ id: z.uuid(), name: z.string() }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Product' });

// ---------- Types ----------

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
