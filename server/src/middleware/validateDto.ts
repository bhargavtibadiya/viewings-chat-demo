import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { sendBadRequest } from '../utils/helpers/response.js';

/**
 * Creates middleware that validates and normalizes a request body with a Zod schema.
 *
 * @param schema - Schema used to parse the incoming request body
 * @returns Express middleware that sends validation errors or continues with parsed data
 */
export function validateDto<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      sendBadRequest(res, 'Validation failed', errors);
      return;
    }
    // [WHY] replace the raw body so handlers use Zod's parsed and transformed values.
    req.body = result.data;
    next();
  };
}
