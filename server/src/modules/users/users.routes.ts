import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] Get current user profile
router.get(
  ROUTES.USERS.ME,
  authenticate,
  usersController.getMe,
);

export default router;
