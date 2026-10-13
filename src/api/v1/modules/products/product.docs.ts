import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  commonErrorResponses,
  errorResponseSchema,
  jsonContent,
  paginatedResponse,
  successResponse,
} from '../../../../config/swagger.js';

import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  productResponseSchema,
  updateProductSchema,
} from './product.schema.js';

const TAG = 'Products';
const BASE = '/products';

export function registerProductDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: BASE,
    tags: [TAG],
    summary: 'List products with pagination, filters, search and sorting',
    request: { query: listProductsQuerySchema },
    responses: {
      200: jsonContent('Paginated list of products', paginatedResponse(productResponseSchema)),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Get a product by ID',
    request: { params: productIdParamsSchema },
    responses: {
      200: jsonContent('The product', successResponse(productResponseSchema)),
      404: jsonContent('Product not found', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: BASE,
    tags: [TAG],
    summary: 'Create a product',
    request: { body: jsonContent('Product to create', createProductSchema) },
    responses: {
      201: jsonContent('Created product', successResponse(productResponseSchema)),
      409: jsonContent('SKU already exists', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Update a product (partial)',
    request: {
      params: productIdParamsSchema,
      body: jsonContent('Fields to update', updateProductSchema),
    },
    responses: {
      200: jsonContent('Updated product', successResponse(productResponseSchema)),
      404: jsonContent('Product not found', errorResponseSchema),
      409: jsonContent('SKU already exists', errorResponseSchema),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${BASE}/{id}`,
    tags: [TAG],
    summary: 'Delete a product (soft delete)',
    request: { params: productIdParamsSchema },
    responses: {
      204: { description: 'Product deleted' },
      404: jsonContent('Product not found', errorResponseSchema),
      ...commonErrorResponses,
    },
  });
}
