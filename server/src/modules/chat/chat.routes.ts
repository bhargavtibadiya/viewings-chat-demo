import { Router } from 'express';
import { chatController } from './chat.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';
import { chatLimiter } from '../../services/rate-limit/index.js';

const router = Router();

/**
 * @route   GET /api/chat/sessions/:propertyId
 * @desc    Get or create chat session for user and property
 * @access  Protected
 */
router.get(
  ROUTES.CHAT.GET_OR_CREATE_SESSION,
  authenticate,
  chatController.getOrCreateSession,
);

/**
 * @route   GET /api/chat/sessions/:sessionId/messages
 * @desc    List chat messages for a session
 * @access  Protected
 */
router.get(
  ROUTES.CHAT.GET_MESSAGES,
  authenticate,
  chatController.getMessages,
);

/**
 * @route   GET /api/chat/sessions/:sessionId/memory
 * @desc    Read session context memory
 * @access  Protected
 */
router.get(
  ROUTES.CHAT.GET_SESSION_MEMORY,
  authenticate,
  chatController.getSessionMemory,
);

/**
 * @route   POST /api/chat/sessions/:sessionId/messages
 * @desc    Post a user message and receive full assistant JSON turn
 * @access  Protected
 */
router.post(
  ROUTES.CHAT.POST_MESSAGE,
  authenticate,
  chatLimiter,
  chatController.postMessage,
);

/**
 * @route   POST /api/chat/sessions/:sessionId/ask-lister
 * @desc    Escalate a question to the property lister
 * @access  Protected
 */
router.post(
  ROUTES.CHAT.ASK_LISTER,
  authenticate,
  chatLimiter,
  chatController.askLister,
);

/**
 * @route   POST /api/chat/sessions/:sessionId/book
 * @desc    Book a viewing slot from chat using the authenticated user profile
 * @access  Protected
 */
router.post(
  ROUTES.CHAT.BOOK_SLOT,
  authenticate,
  chatLimiter,
  chatController.bookSlot,
);

export default router;
