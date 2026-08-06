import { Router } from 'express';
import { demoController } from './demo.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] Get turn logs for demo control panel.
router.get(
  ROUTES.DEMO.TURNS,
  authenticate,
  demoController.getTurns,
);

// [NOTE] Get evidence fixture metadata.
router.get(
  ROUTES.DEMO.FIXTURES,
  authenticate,
  demoController.getFixtures,
);

export default router;
