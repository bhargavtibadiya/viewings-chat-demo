import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers/logger.js';
import { ServiceError } from '../utils/helpers/serviceError.js';

const logger = createLogger('ErrorHandler');

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Determines whether an unknown value carries an HTTP status code.
 *
 * @param error - The value caught by Express error handling
 * @returns Whether the value is an application error
 */
export function isAppError(error: unknown): error is AppError {
  if (error instanceof ServiceError) {
    return true;
  }
  return error instanceof Error && 'statusCode' in error;
}

/**
 * Converts known application errors and unexpected failures into HTTP responses.
 *
 * @param error - The error raised by earlier middleware or route handlers
 * @param _req - The incoming HTTP request
 * @param res - The outgoing HTTP response
 * @param _next - Express callback reserved for error middleware compatibility
 * @returns No value; always sends an error response
 */
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

  // [SEC] do not expose unexpected error details to the client.
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
