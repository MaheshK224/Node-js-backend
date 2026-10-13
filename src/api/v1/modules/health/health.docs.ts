import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { jsonContent, successResponse } from '../../../../config/swagger.js';

const liveSchema = z.object({
  status: z.literal('ok'),
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  uptimeSeconds: z.number(),
  timestamp: z.iso.datetime(),
});

const readySchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.object({ status: z.enum(['up', 'down']), latencyMs: z.number().optional() }),
});

export function registerHealthDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Liveness check',
    responses: { 200: jsonContent('Service is running', successResponse(liveSchema)) },
  });

  registry.registerPath({
    method: 'get',
    path: '/health/ready',
    tags: ['Health'],
    summary: 'Readiness check (includes database)',
    responses: {
      200: jsonContent('Service and database are ready', successResponse(readySchema)),
      503: jsonContent('Database is unreachable', successResponse(readySchema)),
    },
  });
}
