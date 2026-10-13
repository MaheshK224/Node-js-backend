import { Router } from 'express';

import { appInfo } from '../../config/appInfo.js';
import { buildOpenApiDocument, createOpenApiRegistry } from '../../config/swagger.js';

import { registerCategoryDocs } from './modules/categories/category.docs.js';
import { categoryRouter } from './modules/categories/category.routes.js';
import { registerHealthDocs } from './modules/health/health.docs.js';
import { healthRouter } from './modules/health/health.routes.js';
import { registerProductDocs } from './modules/products/product.docs.js';
import { productRouter } from './modules/products/product.routes.js';

export const V1_PREFIX = '/api/v1';

/**
 * API version 1. Mounted at /api/v1 in app.ts.
 *
 * Versioning lets you ship breaking changes as /api/v2 while existing clients
 * (e.g. an older mobile app) keep using /api/v1 until they migrate.
 * To add v2: create src/api/v2/, reuse unchanged modules, and mount it next to v1.
 *
 * To add a new module: create modules/<name>/, then register its router and docs below.
 */
export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/categories', categoryRouter);
v1Router.use('/products', productRouter);

export function buildV1OpenApiDocument() {
  const registry = createOpenApiRegistry();
  registerHealthDocs(registry);
  registerCategoryDocs(registry);
  registerProductDocs(registry);
  return buildOpenApiDocument(registry, appInfo.version, V1_PREFIX);
}
