import type { Request } from 'express';
import { pinoHttp } from 'pino-http';

import { logger } from '../config/logger.js';

/**
 * Logs one line per request: method, url, status, response time and request ID.
 * Also attaches `req.log`, a child logger that automatically includes the request ID.
 */
export const requestLogger = pinoHttp({
  logger,
  // Reuse the ID created by the requestId middleware.
  genReqId: (req) => (req as Request).requestId,
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Health checks are called every few seconds by Docker/Kubernetes; don't flood the logs.
  autoLogging: {
    ignore: (req) => req.url?.startsWith('/api/v1/health') ?? false,
  },
  serializers: {
    req: (req: { id: string; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
