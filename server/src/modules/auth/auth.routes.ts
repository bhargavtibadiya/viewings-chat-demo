import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';
import { authLoginLimiter } from '../../services/rate-limit/index.js';

const router = Router();

// [SEC] Login requests are rate-limited before credential validation to slow brute-force attempts.
router.post(
  ROUTES.AUTH.LOGIN,
  authLoginLimiter,
  authController.login,
);

// [NOTE] Return the current profile only after token authentication succeeds.
router.get(
  ROUTES.AUTH.ME,
  authenticate,
  authController.me,
);

export default router;
