export const ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  PROPERTIES: {
    LIST: '/api/properties',
    BY_ID: '/api/properties/:id',
    AVAILABILITY: '/api/properties/:id/availability',
  },
  CHAT: {
    SESSION_BY_PROPERTY: '/api/chat/sessions/:propertyId',
    MESSAGES: '/api/chat/sessions/:sessionId/messages',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    BY_ID: '/api/bookings/:id',
    CANCEL: '/api/bookings/:id/cancel',
  },
  LISTER: {
    QUESTIONS: '/api/lister/questions',
    ANSWER: '/api/lister/questions/:id/answer',
  },
  LEADS: {
    CONTACT: '/api/leads/contact',
    CALLBACK: '/api/leads/callback',
  },
  DEMO: {
    TURNS: '/api/demo/turns/:sessionId',
  },
} as const;

export const APP_ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  PROPERTY: '/properties/:propertyId',
  CHAT: '/chat/:propertyId',
  BOOKINGS: '/bookings',
  BOOKING: '/bookings/:bookingId',
  LISTER_QUESTIONS: '/lister/questions',
  DEMO: '/demo',
} as const;

export function replaceRouteParam(route: string, param: string, value: string): string {
  return route.replace(param, value);
}
