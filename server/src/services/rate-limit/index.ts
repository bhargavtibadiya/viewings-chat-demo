import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../../utils/constants/pagination.js';

// [SEC] login attempts use a separate, stricter budget to reduce credential-stuffing exposure
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

// [SEC] chat requests have an independent budget so expensive model work cannot exhaust general API capacity
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

// [NOTE] this is the default guard for routes without a more specific limiter
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL.windowMs,
  max: RATE_LIMIT.GENERAL.max,
  standardHeaders: true,
  legacyHeaders: false,
});
