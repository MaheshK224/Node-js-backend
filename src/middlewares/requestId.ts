import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

const VALID_REQUEST_ID = /^[\w-]{1,128}$/;

/**
 * Gives every request a unique ID (or reuses the one sent by a gateway / the frontend).
 * The ID is returned in the X-Request-Id response header and added to every log line,
 * so a bug report with a request ID can be traced straight to its logs.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get(REQUEST_ID_HEADER);
  const id = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();

  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
