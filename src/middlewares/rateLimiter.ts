import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';
import type { ApiErrorResponse } from '../utils/apiResponse.js';

/**
 * Limits how many requests one IP can make per time window (protects against abuse / brute force).
 * When you add auth, create a stricter limiter for /auth/login.
 *
 * Note: this stores counters in memory, which is fine for one server. With several servers
 * behind a load balancer use a shared store (e.g. rate-limit-redis).
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
        requestId: req.requestId,
      },
    };
    res.status(options.statusCode).json(body);
  },
});
