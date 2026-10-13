import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates (and converts) the request before it reaches the controller.
 * Invalid input throws a ZodError, which the error handler turns into a 400 response.
 *
 *   router.post('/', validate({ body: createProductSchema }), controller.create);
 *
 * After validation, req.body / req.query / req.params contain the parsed values
 * (numbers are numbers, defaults are applied, unknown fields are removed).
 */
export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as Request['params'];
    }
    if (schemas.query) {
      // In Express 5 req.query is a read-only getter, so it must be redefined, not assigned.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  };
}
