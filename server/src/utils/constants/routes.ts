export const ROUTES = {
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/login',
    ME: '/me',
  },
  USERS: {
    BASE: '/api/users',
    ME: '/me',
  },
  PROPERTIES: {
    BASE: '/api/properties',
    LIST: '/',
    GET_BY_ID: '/:propertyId',
    AVAILABILITY: '/:propertyId/availability',
  },
  CHAT: {
    BASE: '/api/chat',
    GET_OR_CREATE_SESSION: '/sessions/:propertyId',
    GET_MESSAGES: '/sessions/:sessionId/messages',
    POST_MESSAGE: '/sessions/:sessionId/messages',
    GET_SESSION_MEMORY: '/sessions/:sessionId/memory',
  },
  BOOKINGS: {
    BASE: '/api/bookings',
    CREATE: '/',
    LIST: '/',
    GET_BY_ID: '/:bookingId',
    CANCEL: '/:bookingId/cancel',
  },
  LISTER: {
    BASE: '/api/lister',
    LIST_QUESTIONS: '/questions',
    ANSWER_QUESTION: '/questions/:questionId/answer',
  },
  LEADS: {
    BASE: '/api/leads',
    CONTACT: '/contact',
    CALLBACK: '/callback',
  },
  DEMO: {
    BASE: '/api/demo',
    TURNS: '/turns/:sessionId',
    FIXTURES: '/fixtures',
  },
  HEALTH: '/api/health',
} as const;
