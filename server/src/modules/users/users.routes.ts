import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get(
  ROUTES.USERS.ME,
  authenticate,
  usersController.getMe,
);

export default router;
