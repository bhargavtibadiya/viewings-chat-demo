import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';
import { authLoginLimiter } from '../../services/rate-limit/index.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  ROUTES.AUTH.LOGIN,
  authLoginLimiter,
  authController.login,
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get(
  ROUTES.AUTH.ME,
  authenticate,
  authController.me,
);

export default router;
