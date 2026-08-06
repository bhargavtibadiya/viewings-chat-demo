import { Router } from 'express';
import { leadsController } from './leads.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] Capture a contact lead
router.post(
  ROUTES.LEADS.CONTACT,
  authenticate,
  leadsController.captureContact,
);

// [NOTE] Request a callback from the lister
router.post(
  ROUTES.LEADS.CALLBACK,
  authenticate,
  leadsController.requestCallback,
);

export default router;
