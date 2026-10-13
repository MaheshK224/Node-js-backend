import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { buildV1OpenApiDocument, V1_PREFIX, v1Router } from './api/v1/index.js';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { requestId } from './middlewares/requestId.js';
import { requestLogger } from './middlewares/requestLogger.js';

/**
 * Builds the Express app WITHOUT starting the server.
 * server.ts calls listen(); tests import createApp() and use Supertest instead.
 *
 * Middleware order matters: request id -> logging -> security -> parsing -> routes -> 404 -> errors.
 */
export function createApp(): Express {
  const app = express();

  // Correct client IP (req.ip) when running behind a proxy / load balancer.
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(requestLogger);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  setupSwagger(app, buildV1OpenApiDocument());

  app.use(V1_PREFIX, apiRateLimiter, v1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
