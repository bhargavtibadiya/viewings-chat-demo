import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers/logger.js';

const logger = createLogger('HTTP');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const userId = req.user?.id ?? 'anonymous';
    logger.info(`${method} ${originalUrl} → ${res.statusCode} (${durationMs}ms) user=${userId}`);
  });

  next();
}
