import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers/logger.js';
import { ServiceError } from '../utils/helpers/serviceError.js';

const logger = createLogger('ErrorHandler');


export interface AppError extends Error {
  statusCode?: number;
}

export function isAppError(error: unknown): error is AppError {
  if (error instanceof ServiceError) {
    return true;
  }
  return error instanceof Error && 'statusCode' in error;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ServiceError) {
    logger.warn(`${error.statusCode} ${error.message}`);
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (isAppError(error) && typeof error.statusCode === 'number') {
    logger.warn(`${error.statusCode} ${error.message}`);
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
