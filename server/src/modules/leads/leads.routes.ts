import { Router } from 'express';
import { leadsController } from './leads.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   POST /api/leads/contact
 * @desc    Capture a contact lead
 * @access  Protected
 */
router.post(
  ROUTES.LEADS.CONTACT,
  authenticate,
  leadsController.captureContact,
);

/**
 * @route   POST /api/leads/callback
 * @desc    Request a callback from the lister
 * @access  Protected
 */
router.post(
  ROUTES.LEADS.CALLBACK,
  authenticate,
  leadsController.requestCallback,
);

export default router;
