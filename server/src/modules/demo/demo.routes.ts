import { Router } from 'express';
import { demoController } from './demo.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   GET /api/demo/turns/:sessionId
 * @desc    Get turn logs for demo control panel
 * @access  Protected
 */
router.get(
  ROUTES.DEMO.TURNS,
  authenticate,
  demoController.getTurns,
);

/**
 * @route   GET /api/demo/fixtures
 * @desc    Get evidence fixture metadata
 * @access  Protected
 */
router.get(
  ROUTES.DEMO.FIXTURES,
  authenticate,
  demoController.getFixtures,
);

export default router;
