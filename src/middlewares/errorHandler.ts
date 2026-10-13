import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import type { ApiErrorResponse } from '../utils/apiResponse.js';

/**
 * The ONE place where errors become HTTP responses.
 * Controllers and services just `throw`; Express 5 forwards errors from async handlers here
 * automatically (no try/catch or asyncHandler wrapper needed).
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const appError = toAppError(err);
  const log = req.log ?? logger;

  if (appError.statusCode >= 500) {
    log.error({ err }, 'Unhandled error');
  } else {
    log.debug({ err: appError }, 'Request failed');
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined && { details: appError.details }),
      requestId: req.requestId,
    },
  };

  res.status(appError.statusCode).json(body);
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  // Request validation failed (see middlewares/validate.ts)
  if (err instanceof ZodError) {
    return new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  // Known database errors. Codes: https://www.prisma.io/docs/orm/reference/error-reference
  // err.meta is never sent to the client: it contains table and constraint names.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return AppError.conflict('A record with this value already exists');
      case 'P2003':
        return AppError.conflict('Operation violates a relation (record is in use or missing)');
      case 'P2025':
        return AppError.notFound('Record not found');
    }
  }

  // Malformed JSON body sent by the client
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return AppError.badRequest('Malformed JSON in request body');
  }

  // Body too large (express.json limit)
  if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  // Anything else is a bug. Hide internal details from clients in qa/production.
  const message = env.isDevelopment && err instanceof Error ? err.message : 'Something went wrong';
  return new AppError(500, 'INTERNAL_SERVER_ERROR', message);
}
