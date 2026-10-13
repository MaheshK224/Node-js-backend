/**
 * Adds custom properties to Express's Request type ("declaration merging").
 * When you add authentication, put the logged-in user here too, e.g. `user?: AuthUser;`
 */
declare global {
  namespace Express {
    interface Request {
      /** Unique ID of this request, set by middlewares/requestId.ts */
      requestId: string;
    }
  }
}

export {};
