import { Router } from 'express';
import { chatController } from './chat.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';
import { chatLimiter } from '../../services/rate-limit/index.js';

const router = Router();

// [NOTE] Get or create chat session for user and property
router.get(
  ROUTES.CHAT.GET_OR_CREATE_SESSION,
  authenticate,
  chatController.getOrCreateSession,
);

// [NOTE] List chat messages for a session
router.get(
  ROUTES.CHAT.GET_MESSAGES,
  authenticate,
  chatController.getMessages,
);

// [NOTE] Read session context memory
router.get(
  ROUTES.CHAT.GET_SESSION_MEMORY,
  authenticate,
  chatController.getSessionMemory,
);

// [NOTE] Post a user message and receive full assistant JSON turn
router.post(
  ROUTES.CHAT.POST_MESSAGE,
  authenticate,
  chatLimiter,
  chatController.postMessage,
);

// [NOTE] Escalate a question to the property lister
router.post(
  ROUTES.CHAT.ASK_LISTER,
  authenticate,
  chatLimiter,
  chatController.askLister,
);

// [NOTE] Book a viewing slot from chat using the authenticated user profile
router.post(
  ROUTES.CHAT.BOOK_SLOT,
  authenticate,
  chatLimiter,
  chatController.bookSlot,
);

export default router;
