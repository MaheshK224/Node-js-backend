import type { Response } from 'express';

import type { PaginationMeta } from './pagination.js';

/**
 * Every response from this API has the same shape, so the React app can handle
 * all of them with one helper:
 *
 *   success: { success: true,  data: ..., meta?: { pagination } }
 *   error:   { success: false, error: { code, message, details?, requestId? } }
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { statusCode?: number; pagination?: PaginationMeta } = {},
): void {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (options.pagination) {
    body.meta = { pagination: options.pagination };
  }
  res.status(options.statusCode ?? 200).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, { statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
