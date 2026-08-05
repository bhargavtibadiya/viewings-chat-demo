import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../../utils/constants/pagination.js';

export const authLoginLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_LOGIN.windowMs,
  max: RATE_LIMIT.AUTH_LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

export const chatLimiter = rateLimit({
  windowMs: RATE_LIMIT.CHAT.windowMs,
  max: RATE_LIMIT.CHAT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many chat requests. Please slow down.',
  },
});

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL.windowMs,
  max: RATE_LIMIT.GENERAL.max,
  standardHeaders: true,
  legacyHeaders: false,
});
