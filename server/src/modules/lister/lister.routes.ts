import { Router } from 'express';
import { listerController } from './lister.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   GET /api/lister/questions
 * @desc    List unanswered questions for lister properties
 * @access  Protected (Lister)
 */
router.get(
  ROUTES.LISTER.LIST_QUESTIONS,
  authenticate,
  requireRole('LISTER', 'DEMO_ADMIN'),
  listerController.listQuestions,
);

/**
 * @route   POST /api/lister/questions/:questionId/answer
 * @desc    Answer a lister question
 * @access  Protected (Lister)
 */
router.post(
  ROUTES.LISTER.ANSWER_QUESTION,
  authenticate,
  requireRole('LISTER', 'DEMO_ADMIN'),
  listerController.answerQuestion,
);

export default router;
