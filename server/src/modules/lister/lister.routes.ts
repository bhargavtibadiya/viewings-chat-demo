import { Router } from 'express';
import { listerController } from './lister.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] List unanswered questions for lister properties
router.get(
  ROUTES.LISTER.LIST_QUESTIONS,
  authenticate,
  requireRole('LISTER', 'DEMO_ADMIN'),
  listerController.listQuestions,
);

// [NOTE] Answer a lister question
router.post(
  ROUTES.LISTER.ANSWER_QUESTION,
  authenticate,
  requireRole('LISTER', 'DEMO_ADMIN'),
  listerController.answerQuestion,
);

export default router;
