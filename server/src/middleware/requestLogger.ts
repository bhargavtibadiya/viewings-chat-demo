import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers/logger.js';

const logger = createLogger('HTTP');

/**
 * Logs the final status, duration, and authenticated user for each completed request.
 *
 * @param req - The incoming HTTP request
 * @param res - The outgoing HTTP response
 * @param next - Express callback that continues the middleware chain
 * @returns No value; registers logging and continues the request
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  // [WHY] wait for finish so the log records the response's actual status code.
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const userId = req.user?.id ?? 'anonymous';
    logger.info(`${method} ${originalUrl} → ${res.statusCode} (${durationMs}ms) user=${userId}`);
  });

  next();
}
