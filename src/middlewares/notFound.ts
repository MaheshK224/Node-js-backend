import type { Request } from 'express';

import { AppError } from '../utils/AppError.js';

/** Runs when no route matched. Passes a 404 to the error handler. */
export function notFound(req: Request): never {
  throw AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
}
