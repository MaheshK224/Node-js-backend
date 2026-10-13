/**
 * An "expected" error with an HTTP status, e.g. resource not found or duplicate SKU.
 * Throw it anywhere (service, repository, middleware); the global error handler
 * turns it into the standard JSON error response.
 *
 *   throw AppError.notFound('Product not found');
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Resource already exists', details?: unknown): AppError {
    return new AppError(409, 'CONFLICT', message, details);
  }
}
