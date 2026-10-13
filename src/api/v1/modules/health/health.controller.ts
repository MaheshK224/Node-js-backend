import type { Request, Response } from 'express';

import { appInfo } from '../../../../config/appInfo.js';
import { env } from '../../../../config/env.js';
import { prisma } from '../../../../db/prisma.js';
import { sendSuccess } from '../../../../utils/apiResponse.js';

export const healthController = {
  /**
   * Liveness: "is the process running?" Never touches the database.
   * Docker/Kubernetes restart the container if this fails.
   */
  live: (_req: Request, res: Response): void => {
    sendSuccess(res, {
      status: 'ok',
      name: appInfo.name,
      version: appInfo.version,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Readiness: "can it serve traffic?" Checks the database.
   * A load balancer stops sending traffic while this returns 503.
   */
  ready: async (req: Request, res: Response): Promise<void> => {
    const startedAt = performance.now();
    try {
      // Raw SQL with Prisma: tagged template, values are automatically parameterised.
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, {
        status: 'ok',
        database: { status: 'up', latencyMs: Math.round(performance.now() - startedAt) },
      });
    } catch (err) {
      req.log.error({ err }, 'Readiness check failed: database unreachable');
      sendSuccess(res, { status: 'error', database: { status: 'down' } }, { statusCode: 503 });
    }
  },
};
