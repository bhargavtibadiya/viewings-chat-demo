import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { sendBadRequest } from '../utils/helpers/response.js';

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
    req.body = result.data;
    next();
  };
}
