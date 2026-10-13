import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  commonErrorResponses,
  errorResponseSchema,
  jsonContent,
  paginatedResponse,
  successResponse,
} from '../../../../config/swagger.js';

import {
  categoryIdParamsSchema,
  categoryResponseSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from './category.schema.js';

const TAG = 'Categories';
const BASE = '/categories';

export function registerCategoryDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: BASE,
    tags: [TAG],
    summary: 'List categories (paginated)',
    request: { query: listCategoriesQuerySchema },
    responses: {
      200: jsonContent('Paginated list of categories', paginatedResponse(categoryResponseSchema)),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Get a category by ID',
    request: { params: categoryIdParamsSchema },
    responses: {
      200: jsonContent('The category', successResponse(categoryResponseSchema)),
      404: jsonContent('Category not found', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: BASE,
    tags: [TAG],
    summary: 'Create a category',
    request: { body: jsonContent('Category to create', createCategorySchema) },
    responses: {
      201: jsonContent('Created category', successResponse(categoryResponseSchema)),
      409: jsonContent('Category name already exists', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Update a category (partial)',
    request: {
      params: categoryIdParamsSchema,
      body: jsonContent('Fields to update', updateCategorySchema),
    },
    responses: {
      200: jsonContent('Updated category', successResponse(categoryResponseSchema)),
      404: jsonContent('Category not found', errorResponseSchema),
      409: jsonContent('Category name already exists', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Delete a category (only if it has no products)',
    request: { params: categoryIdParamsSchema },
    responses: {
      204: { description: 'Category deleted' },
      404: jsonContent('Category not found', errorResponseSchema),
      409: jsonContent('Category still has products', errorResponseSchema),
      ...commonErrorResponses,
    },
  });
}
