import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';

import { env } from './env.js';

/**
 * API documentation is generated from the SAME zod schemas used for validation,
 * so docs and code can never drift apart.
 *
 * - Swagger UI:   GET /api-docs
 * - Raw OpenAPI:  GET /api-docs.json  (React can generate typed API clients from this,
 *                 e.g. `npx openapi-typescript http://localhost:4000/api-docs.json -o src/api/schema.ts`)
 */

// ---------- Shared response schemas (match utils/apiResponse.ts) ----------

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().meta({ example: 'NOT_FOUND' }),
      message: z.string().meta({ example: 'Product not found' }),
      details: z.unknown().optional(),
      requestId: z.string().optional(),
    }),
  })
  .meta({ id: 'ErrorResponse' });

const paginationMetaSchema = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  })
  .meta({ id: 'PaginationMeta' });

export function successResponse<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), data });
}

export function paginatedResponse<T extends z.ZodType>(item: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(item),
    meta: z.object({ pagination: paginationMetaSchema }),
  });
}

/** Builds a `responses` entry for registry.registerPath(). */
export function jsonContent(description: string, schema: z.ZodType) {
  return { description, content: { 'application/json': { schema } } };
}

export const commonErrorResponses = {
  400: jsonContent('Validation error', errorResponseSchema),
  429: jsonContent('Too many requests', errorResponseSchema),
  500: jsonContent('Internal server error', errorResponseSchema),
};

// ---------- Document + UI ----------

export function createOpenApiRegistry(): OpenAPIRegistry {
  return new OpenAPIRegistry();
}

export function buildOpenApiDocument(
  registry: OpenAPIRegistry,
  version: string,
  serverUrl: string,
) {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Inventory API',
      version,
      description: 'REST API for managing product categories and products.',
    },
    servers: [{ url: serverUrl }],
  });
}

export function setupSwagger(
  app: Express,
  document: ReturnType<typeof buildOpenApiDocument>,
): void {
  if (!env.SWAGGER_ENABLED) return;

  app.get('/api-docs.json', (_req, res) => {
    res.json(document);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(document, { customSiteTitle: 'Inventory API Docs' }),
  );
}
