import { Router } from 'express';
import { propertiesController } from './properties.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] List properties with filters
router.get(
  ROUTES.PROPERTIES.LIST,
  authenticate,
  propertiesController.listProperties,
);

// [NOTE] Get property detail
router.get(
  ROUTES.PROPERTIES.GET_BY_ID,
  authenticate,
  propertiesController.getPropertyById,
);

// [NOTE] Get available viewing slots
router.get(
  ROUTES.PROPERTIES.AVAILABILITY,
  authenticate,
  propertiesController.getAvailability,
);

export default router;
