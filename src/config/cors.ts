import type { CorsOptions } from 'cors';

import { env } from './env.js';

/**
 * Only the frontend URLs listed in CORS_ORIGINS may call this API from a browser.
 * Requests without an Origin header (curl, Postman, server-to-server) are allowed.
 */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
  // Set to true once you add cookie-based auth.
  credentials: false,
  maxAge: 600,
};
