export const RATE_LIMIT = {
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
  CHAT: {
    windowMs: 60 * 1000,
    max: 30,
  },
  GENERAL: {
    windowMs: 60 * 1000,
    max: 120,
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CHAT_MESSAGES = {
  DEFAULT_LIMIT: 20,
} as const;

export const AI = {
  MAX_TOOL_ITERATIONS: 6,
  MAX_RECENT_MESSAGES: 20,
} as const;

export const TIMEZONE = 'Pacific/Auckland' as const;
